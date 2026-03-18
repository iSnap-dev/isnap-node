import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify an incoming webhook signature.
 *
 * Checks that the HMAC-SHA256 signature matches and the timestamp is within
 * the 5-minute replay window.
 *
 * @param secret - The webhook secret (from {@link Webhook.secret})
 * @param signature - The `x-isnap-signature` header value
 * @param timestamp - The `x-isnap-timestamp` header value (Unix seconds)
 * @param payload - The raw request body string
 * @returns `true` if the signature is valid and the timestamp is fresh
 *
 * @example
 * ```ts
 * import { verifyWebhookSignature } from '@isnap/sdk';
 *
 * const valid = verifyWebhookSignature(
 *   webhookSecret,
 *   req.headers['x-isnap-signature'],
 *   req.headers['x-isnap-timestamp'],
 *   req.body,
 * );
 * if (!valid) return res.status(401).send('Invalid signature');
 * ```
 */
export function verifyWebhookSignature(
  secret: string,
  signature: string,
  timestamp: string,
  payload: string,
): boolean {
  // Reject if timestamp is too old (5 minutes)
  const ts = parseInt(timestamp, 10);
  const age = Math.abs(Date.now() / 1000 - ts);
  if (age > 300) return false;

  const data = `${ts}.${payload}`;
  const expected = createHmac('sha256', secret).update(data).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
