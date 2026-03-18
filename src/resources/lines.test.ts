import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { init } from '../client.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('LinesResource', () => {
  const client = init({ apiKey: 'isnap_test_key', baseUrl: 'https://api.test.com' });

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  function mockOk(data: unknown) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
  }

  it('list() should GET /lines', async () => {
    mockOk({ lines: [], total: 0, page: 1, limit: 20 });

    await client.lines.list();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/lines',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('list() should pass type and area_code filters', async () => {
    mockOk({ lines: [], total: 0, page: 1, limit: 20 });

    await client.lines.list({ type: 'iphone', area_code: '415', page: 2 });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('type=iphone');
    expect(url).toContain('area_code=415');
    expect(url).toContain('page=2');
  });

  it('get() should GET /lines/:id', async () => {
    const line = { id: 'ln-1', phone_number: '+15551234567' };
    mockOk(line);

    const result = await client.lines.get('ln-1');

    expect(result).toEqual(line);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test.com/lines/ln-1',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
