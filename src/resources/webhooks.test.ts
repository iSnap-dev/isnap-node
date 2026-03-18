import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from '../client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('WebhooksResource', () => {
  const client = init({ apiKey: 'isnap_test_key', baseUrl: 'https://api.test.com' });

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('create() should POST to /v1/webhooks', async () => {
    const webhook = { id: 'wh-1', url: 'https://example.com/hook', secret: 'sec_123' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(webhook),
    });

    const result = await client.webhooks.create({
      url: 'https://example.com/hook',
      events: ['message.sent'],
    });

    expect(result).toEqual(webhook);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/webhooks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/hook', events: ['message.sent'] }),
      }),
    );
  });

  it('list() should GET /v1/webhooks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ webhooks: [] }),
    });

    const result = await client.webhooks.list();

    expect(result).toEqual({ webhooks: [] });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/webhooks',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('delete() should DELETE /v1/webhooks/:id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await client.webhooks.delete('wh-1');

    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/webhooks/wh-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
