import { Router } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { vectorStoreHealthy } from '../services/vectorStore.js';

const router = Router();

router.get('/', async (_req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  const chromaUp = env.openai.enabled ? await vectorStoreHealthy().catch(() => false) : null;

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    services: {
      mongo: mongoUp ? 'up' : 'down',
      chroma: chromaUp === null ? 'disabled' : chromaUp ? 'up' : 'down',
      openai: env.openai.enabled ? 'configured' : 'disabled',
      google: env.google.enabled ? 'configured' : 'disabled',
      slack: env.slack.enabled ? 'configured' : 'disabled',
      jira: env.jira.enabled ? 'configured' : 'disabled',
    },
  });
});

export default router;
