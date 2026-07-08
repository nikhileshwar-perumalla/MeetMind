import axios from 'axios';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

function getClient() {
  if (!env.jira.enabled) throw ApiError.badRequest('Jira is not configured on the server.');
  const auth = Buffer.from(`${env.jira.email}:${env.jira.apiToken}`).toString('base64');
  return axios.create({
    baseURL: `${env.jira.baseUrl.replace(/\/$/, '')}/rest/api/3`,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

/** Wraps plain text in the Atlassian Document Format required by Jira Cloud v3. */
function toADF(text) {
  return {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: text || '' }] }],
  };
}

const PRIORITY_MAP = { high: 'High', medium: 'Medium', low: 'Low' };

/**
 * Creates a Jira issue from a MeetMind action item.
 * @returns {Promise<{ issueKey: string, url: string }>}
 */
export async function createIssueFromAction(actionItem, meeting, projectKey) {
  const client = getClient();
  const key = projectKey || env.jira.projectKey;

  const descriptionText = [
    actionItem.assignee ? `Assignee (from transcript): ${actionItem.assignee}` : null,
    actionItem.dueDate ? `Due: ${actionItem.dueDate}` : null,
    '',
    `Source meeting: ${meeting.title}`,
    'Created automatically by MeetMind.',
  ]
    .filter((l) => l !== null)
    .join('\n');

  const { data } = await client.post('/issue', {
    fields: {
      project: { key },
      summary: actionItem.title.slice(0, 250),
      description: toADF(descriptionText),
      issuetype: { name: 'Task' },
      priority: { name: PRIORITY_MAP[actionItem.priority] || 'Medium' },
    },
  });

  return {
    issueKey: data.key,
    url: `${env.jira.baseUrl.replace(/\/$/, '')}/browse/${data.key}`,
  };
}
