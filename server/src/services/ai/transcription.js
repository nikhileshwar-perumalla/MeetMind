import fs from 'fs';
import { getOpenAI } from './openaiClient.js';
import { env } from '../../config/env.js';

/**
 * Transcribes an audio/video file to text using OpenAI Whisper.
 * @param {string} filePath absolute path to the media file
 * @returns {Promise<string>} the transcript
 */
export async function transcribeFile(filePath) {
  const openai = getOpenAI();
  const result = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: env.openai.transcribeModel,
    response_format: 'text',
  });
  // With response_format 'text' the SDK returns the raw string.
  return typeof result === 'string' ? result : result.text || '';
}
