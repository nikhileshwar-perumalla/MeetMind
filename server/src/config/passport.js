import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { User } from '../models/User.js';
import { ensurePersonalWorkspace } from '../services/workspaceService.js';

/**
 * Configures passport with the Google OAuth 2.0 strategy when credentials are
 * present. We use passport only for the OAuth handshake; sessions are stateless
 * (JWT), so no serialize/deserialize is needed.
 */
export function configurePassport() {
  if (!env.google.enabled) return passport;

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false, { message: 'Google account has no email' });

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
          if (!user) {
            user = await User.create({
              name: profile.displayName || email.split('@')[0],
              email,
              provider: 'google',
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
            });
            await ensurePersonalWorkspace(user);
          } else if (!user.googleId) {
            // Link Google to an existing local account.
            user.googleId = profile.id;
            if (!user.avatarUrl) user.avatarUrl = profile.photos?.[0]?.value;
            await user.save();
          }

          user.lastLoginAt = new Date();
          await user.save();
          return done(null, user);
        } catch (err) {
          logger.error('Google OAuth error', { message: err.message });
          return done(err);
        }
      }
    )
  );

  logger.info('Google OAuth strategy enabled');
  return passport;
}
