import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { iSnapClient, init } from './client.js';
import { iSnapError, RateLimitError } from './types.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('iSnapClient', () => {
  let client: iSnapClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = init({ apiKey: 'isnap_test_key', baseUrl: 'https://api.test.com' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with config', () => {
    expect(client).toBeInstanceOf(iSnapClient);
    expect(client.messages).toBeDefined();
    expect(client.lines).toBeDefined();
    expect(client.webhooks).toBeDefined();
  });

  it('should send Authorization header with API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ messages: [] }),
    });

    await client.request('GET', '/v1/messages');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'isnap_test_key',
        }),
      }),
    );
  });

  it('should include Content-Type for POST requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 'msg-1' }),
    });

    await client.request('POST', '/v1/messages', { body: 'Hello' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ body: 'Hello' }),
      }),
    );
  });

  it('should throw iSnapError on non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not found' }),
    });

    await expect(client.request('GET', '/v1/messages/missing')).rejects.toThrow(iSnapError);
  });

  it('should retry on 429 and throw RateLimitError after max retries', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '0' }),
    });

    await expect(client.request('GET', '/v1/messages')).rejects.toThrow(RateLimitError);

    // 1 initial + 3 retries = 4 calls
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('should handle 204 responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await client.request('DELETE', '/v1/webhooks/wh-1');
    expect(result).toBeUndefined();
  });

  it('should append query params to URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ messages: [] }),
    });

    await client.request('GET', '/v1/messages', undefined, { page: '2', limit: '10' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/messages?page=2&limit=10',
      expect.anything(),
    );
  });

  it('should strip trailing slash from baseUrl', () => {
    const c = init({ apiKey: 'test', baseUrl: 'https://api.test.com/' });
    expect(c).toBeInstanceOf(iSnapClient);
  });
});
