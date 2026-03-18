import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from '../client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('MessagesResource', () => {
  const client = init({ apiKey: 'isnap_test_key', baseUrl: 'https://api.test.com' });

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  function mockOk(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status,
      json: () => Promise.resolve(data),
    });
  }

  it('send() should POST to /v1/messages with body', async () => {
    const msg = { id: 'msg-1', body: 'Hi' };
    mockOk(msg, 201);

    const result = await client.messages.send({ line_id: 'ln-1', to: '+15551234567', body: 'Hi' });

    expect(result).toEqual(msg);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ line_id: 'ln-1', to: '+15551234567', body: 'Hi' }),
      }),
    );
  });

  it('get() should GET /v1/messages/:id', async () => {
    const msg = { id: 'msg-1', body: 'Hello' };
    mockOk(msg);

    const result = await client.messages.get('msg-1');

    expect(result).toEqual(msg);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/messages/msg-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('list() should GET /v1/messages with query params', async () => {
    const response = { messages: [], total: 0, page: 1, limit: 20 };
    mockOk(response);

    await client.messages.list({ status: 'delivered', direction: 'outbound', page: 2, limit: 10 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/messages?'),
      expect.anything(),
    );
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('status=delivered');
    expect(url).toContain('direction=outbound');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=10');
  });

  it('list() should omit undefined filters', async () => {
    mockOk({ messages: [], total: 0, page: 1, limit: 20 });

    await client.messages.list({ limit: 5 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain('status=');
    expect(url).not.toContain('direction=');
    expect(url).toContain('limit=5');
  });

  it('listConversations() should GET /v1/messages/conversations', async () => {
    mockOk({ conversations: [], total: 0, page: 1, limit: 20 });

    await client.messages.listConversations({ line_id: 'ln-1', page: 3 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/v1/messages/conversations?');
    expect(url).toContain('line_id=ln-1');
    expect(url).toContain('page=3');
  });

  it('getConversation() should GET /v1/messages/conversations/:id', async () => {
    const thread = {
      conversation: { id: 'conv-1' },
      messages: [],
      total: 0,
      page: 1,
      limit: 25,
    };
    mockOk(thread);

    const result = await client.messages.getConversation('conv-1', { page: 1, limit: 25 });

    expect(result).toEqual(thread);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/v1/messages/conversations/conv-1');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=25');
  });

  it('getConversation() should work without params', async () => {
    mockOk({ conversation: { id: 'conv-1' }, messages: [], total: 0, page: 1, limit: 25 });

    await client.messages.getConversation('conv-1');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('https://api.test.com/v1/messages/conversations/conv-1');
  });
});
