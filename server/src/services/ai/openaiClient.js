import OpenAI from 'openai';
import { env } from '../../config/env.js';

let client = null;

/** Lazily construct the OpenAI client so the server can boot without a key. */
export function getOpenAI() {
  if (!env.openai.enabled) {
    throw new Error('OpenAI is not configured (set OPENAI_API_KEY).');
  }
  if (!client) client = new OpenAI({ apiKey: env.openai.apiKey });
  return client;
}
