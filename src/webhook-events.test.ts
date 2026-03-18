import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { parseWebhook } from './webhook-events.js';

function sign(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

describe('parseWebhook', () => {
  const secret = 'whsec_test_secret';

  afterEach(() => vi.restoreAllMocks());

  function makeEvent(type: string) {
    return JSON.stringify({
      event: type,
      data: { id: 'msg-1', body: 'Hello' },
      webhook_id: 'wh-1',
      timestamp: new Date().toISOString(),
    });
  }

  it('should verify and parse a valid message.sent event', () => {
    const body = makeEvent('message.sent');
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(secret, ts, body);

    const result = parseWebhook({ secret, signature: sig, timestamp: ts, body });

    expect(result.verified).toBe(true);
    expect(result.event.event).toBe('message.sent');
    expect(result.event.data.id).toBe('msg-1');
  });

  it('should return verified=false for invalid signature', () => {
    const body = makeEvent('message.delivered');
    const ts = String(Math.floor(Date.now() / 1000));

    const result = parseWebhook({ secret, signature: 'bad_signature', timestamp: ts, body });

    expect(result.verified).toBe(false);
    expect(result.event.event).toBe('message.delivered');
  });

  it('should return verified=false for expired timestamp', () => {
    const body = makeEvent('message.read');
    const ts = String(Math.floor(Date.now() / 1000) - 600); // 10 min ago
    const sig = sign(secret, ts, body);

    const result = parseWebhook({ secret, signature: sig, timestamp: ts, body });

    expect(result.verified).toBe(false);
  });

  it('should parse message.failed events', () => {
    const body = makeEvent('message.failed');
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(secret, ts, body);

    const result = parseWebhook({ secret, signature: sig, timestamp: ts, body });

    expect(result.verified).toBe(true);
    expect(result.event.event).toBe('message.failed');
  });

  it('should parse message.received events', () => {
    const body = makeEvent('message.received');
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(secret, ts, body);

    const result = parseWebhook({ secret, signature: sig, timestamp: ts, body });

    expect(result.verified).toBe(true);
    expect(result.event.event).toBe('message.received');
  });

  it('should throw on invalid JSON body', () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(secret, ts, 'not json');

    expect(() =>
      parseWebhook({ secret, signature: sig, timestamp: ts, body: 'not json' }),
    ).toThrow();
  });
});
