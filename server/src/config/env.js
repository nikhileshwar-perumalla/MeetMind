import dotenv from 'dotenv';

dotenv.config();

const bool = (v) => v === 'true' || v === '1';
const int = (v, fallback) => (v ? parseInt(v, 10) : fallback);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: int(process.env.PORT, 4000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/meetmind',
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/api/auth/google/callback',
    get enabled() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    get enabled() {
      return Boolean(this.apiKey);
    },
  },

  jira: {
    baseUrl: process.env.JIRA_BASE_URL || '',
    email: process.env.JIRA_EMAIL || '',
    apiToken: process.env.JIRA_API_TOKEN || '',
    projectKey: process.env.JIRA_PROJECT_KEY || '',
    get enabled() {
      return Boolean(this.baseUrl && this.email && this.apiToken && this.projectKey);
    },
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    get enabled() {
      return Boolean(this.botToken);
    },
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxBytes: int(process.env.MAX_UPLOAD_MB, 100) * 1024 * 1024,
  },

  verbose: bool(process.env.VERBOSE),
};

/** Warn loudly (but don't crash) when important optional config is missing. */
export function reportConfigStatus(logger) {
  if (!env.openai.enabled) {
    logger.warn('OPENAI_API_KEY not set — transcription, summaries, and search are disabled.');
  }
  if (!env.google.enabled) {
    logger.info('Google OAuth not configured — only email/password auth is available.');
  }
  if (!env.jira.enabled) logger.info('Jira integration not configured.');
  if (!env.slack.enabled) logger.info('Slack integration not configured.');
  if (env.jwt.secret === 'dev-insecure-secret-change-me' && env.isProd) {
    logger.warn('JWT_SECRET is using the insecure default in production — set a strong secret!');
  }
}
