import { verifyWebhookSignature } from './webhook-verify.js';
import type { WebhookEvent } from './types.js';

/**
 * Parameters for parsing an incoming webhook request.
 */
export interface ParseWebhookOptions {
  /** The webhook secret (from {@link Webhook.secret}). */
  secret: string;
  /** The `x-isnap-signature` header value. */
  signature: string;
  /** The `x-isnap-timestamp` header value (Unix seconds). */
  timestamp: string;
  /** The raw request body string. */
  body: string;
}

/**
 * Result of parsing a webhook request.
 */
export interface ParseWebhookResult {
  /** Whether the signature was valid and the timestamp was fresh. */
  verified: boolean;
  /** The parsed and typed webhook event. Only meaningful when `verified` is `true`. */
  event: WebhookEvent;
}

/**
 * Verify and parse an incoming webhook request in a single call.
 *
 * Combines signature verification with JSON parsing to produce a typed
 * {@link WebhookEvent} that supports discriminated-union narrowing.
 *
 * @param options - Signature, timestamp, secret, and raw body
 * @returns Object with `verified` flag and the parsed `event`
 *
 * @example
 * ```ts
 * import { parseWebhook } from '@isnap/sdk';
 *
 * app.post('/webhooks/isnap', (req, res) => {
 *   const { verified, event } = parseWebhook({
 *     secret: process.env.WEBHOOK_SECRET!,
 *     signature: req.headers['x-isnap-signature'] as string,
 *     timestamp: req.headers['x-isnap-timestamp'] as string,
 *     body: req.body, // raw string
 *   });
 *
 *   if (!verified) return res.status(401).send('Invalid signature');
 *
 *   switch (event.event) {
 *     case 'message.sent':
 *       console.log('Sent:', event.data.id);
 *       break;
 *     case 'message.received':
 *       console.log('Received:', event.data.body);
 *       break;
 *   }
 *
 *   res.sendStatus(200);
 * });
 * ```
 */
export function parseWebhook(options: ParseWebhookOptions): ParseWebhookResult {
  const { secret, signature, timestamp, body } = options;
  const event: WebhookEvent = JSON.parse(body);
  const verified = verifyWebhookSignature(secret, signature, timestamp, body);
  return { verified, event };
}
