import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  me,
  logout,
  googleCallback,
  registerSchema,
  loginSchema,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

// Google OAuth — only mounted when configured.
if (env.google.enabled) {
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.clientUrl}/login?error=oauth`,
    }),
    googleCallback
  );
}

// Advertise which auth methods are available so the SPA can render accordingly.
router.get('/providers', (_req, res) => {
  res.json({ local: true, google: env.google.enabled });
});

export default router;
