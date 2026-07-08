import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { env } from '../../config/env.js';

/**
 * Structured schema the LLM must return. Using LangChain's `withStructuredOutput`
 * enforces valid JSON via the model's function-calling interface.
 */
const insightsSchema = z.object({
  summary: z
    .string()
    .describe('A concise 3–6 sentence executive summary of the meeting.'),
  topics: z
    .array(z.string())
    .describe('3–8 short topic labels covered in the meeting.'),
  keyDecisions: z
    .array(z.string())
    .describe('Concrete decisions that were made. Empty array if none.'),
  actionItems: z
    .array(
      z.object({
        title: z.string().describe('The task to be done, phrased imperatively.'),
        assignee: z
          .string()
          .optional()
          .describe('Person responsible, if named. Otherwise omit.'),
        dueDate: z
          .string()
          .optional()
          .describe('Due date if mentioned (ISO or natural language). Otherwise omit.'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    )
    .describe('Follow-up tasks extracted from the discussion.'),
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are MeetMind, an expert meeting analyst. Given a raw meeting transcript,
extract a faithful, well-structured set of insights. Be accurate and do not
invent facts, decisions, owners, or dates that are not supported by the
transcript. Prefer omitting an assignee/dueDate over guessing.`,
  ],
  ['human', 'Meeting title: {title}\n\nTranscript:\n"""\n{transcript}\n"""'],
]);

/**
 * Runs the LangChain insight-extraction chain over a transcript.
 * @param {{ title: string, transcript: string }} input
 * @returns {Promise<z.infer<typeof insightsSchema>>}
 */
export async function extractInsights({ title, transcript }) {
  const model = new ChatOpenAI({
    apiKey: env.openai.apiKey,
    model: env.openai.chatModel,
    temperature: 0.2,
  });

  const structured = model.withStructuredOutput(insightsSchema, { name: 'meeting_insights' });
  const chain = prompt.pipe(structured);

  // Guard against oversized transcripts blowing the context window.
  const clipped = transcript.length > 48000 ? transcript.slice(0, 48000) : transcript;
  return chain.invoke({ title, transcript: clipped });
}
