import type { WebhookFormat } from '../types';

interface WebhookPayload {
  eventType: string;
  title: string;
  message: string;
  timestamp: string;
}

export function detectWebhookFormat(url: string): WebhookFormat {
  if (url.includes('hooks.slack.com')) return 'slack';
  if (url.includes('discord.com/api/webhooks')) return 'discord';
  return 'json';
}

export function formatPayload(payload: WebhookPayload, format: WebhookFormat): Record<string, unknown> {
  switch (format) {
    case 'slack':
      return {
        text: `*${payload.title}*\n${payload.message}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: payload.title } },
          { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
          { type: 'context', elements: [
            { type: 'mrkdwn', text: `_${payload.eventType}_ | ${payload.timestamp}` },
          ]},
        ],
      };
    case 'discord':
      return {
        embeds: [{
          title: payload.title,
          description: payload.message,
          color: 0x6366F1,
          footer: { text: `${payload.eventType} | FRE Analytics` },
          timestamp: payload.timestamp,
        }],
      };
    default:
      return payload;
  }
}
