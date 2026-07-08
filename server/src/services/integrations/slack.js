import { WebClient } from '@slack/web-api';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

let slack = null;
function getSlack() {
  if (!env.slack.enabled) throw ApiError.badRequest('Slack is not configured on the server.');
  if (!slack) slack = new WebClient(env.slack.botToken);
  return slack;
}

/** Formats a meeting summary + action items as Slack Block Kit blocks. */
function buildBlocks(meeting) {
  const actionLines = meeting.actionItems.length
    ? meeting.actionItems
        .map(
          (a) =>
            `• *${a.title}*${a.assignee ? ` — _${a.assignee}_` : ''}${
              a.dueDate ? ` (due ${a.dueDate})` : ''
            }`
        )
        .join('\n')
    : '_No action items._';

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📋 ${meeting.title}`.slice(0, 150) },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: meeting.summary || '_No summary available._' },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Action Items*\n${actionLines}` },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: 'Shared via MeetMind' }],
    },
  ];
}

/**
 * Posts a meeting summary to a Slack channel.
 * @returns {Promise<{ channel: string, ts: string }>}
 */
export async function postMeetingSummary(meeting, channel) {
  const client = getSlack();
  const target = channel || env.slack.defaultChannel;
  const res = await client.chat.postMessage({
    channel: target,
    text: `Meeting summary: ${meeting.title}`, // fallback for notifications
    blocks: buildBlocks(meeting),
  });
  return { channel: res.channel, ts: res.ts };
}
