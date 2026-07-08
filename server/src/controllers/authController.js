import { z } from 'zod';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { ensurePersonalWorkspace } from '../services/workspaceService.js';
import { env } from '../config/env.js';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const user = new User({ name, email, provider: 'local' });
  await user.setPassword(password);
  await user.save();
  const workspace = await ensurePersonalWorkspace(user);

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ token, user, defaultWorkspace: workspace });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();
  const workspace = await ensurePersonalWorkspace(user);

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.json({ token, user, defaultWorkspace: workspace });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

/** Google OAuth callback — issues a JWT and redirects back to the SPA. */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  await ensurePersonalWorkspace(user);
  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.redirect(`${env.clientUrl}/auth/callback?token=${token}`);
});
