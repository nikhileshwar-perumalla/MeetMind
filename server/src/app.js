import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import passport from 'passport';

import { env } from './config/env.js';
import { configurePassport } from './config/passport.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  app.use(passport.initialize());
  configurePassport();

  // Rate-limit auth endpoints to blunt credential-stuffing.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/search', searchRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
