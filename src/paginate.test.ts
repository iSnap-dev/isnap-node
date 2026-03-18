import { describe, it, expect } from 'vitest';
import { paginate } from './paginate.js';

describe('paginate', () => {
  it('should yield all items from a single page', async () => {
    const fetcher = async (_p: { page?: number; limit?: number }) => ({
      messages: [{ id: '1' }, { id: '2' }],
      total: 2,
      page: 1,
      limit: 100,
    });

    const items: { id: string }[] = [];
    for await (const item of paginate(fetcher, {}, 'messages')) {
      items.push(item);
    }

    expect(items).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('should paginate across multiple pages', async () => {
    let callCount = 0;
    const fetcher = async (p: { page?: number; limit?: number }) => {
      callCount++;
      const page = p.page ?? 1;
      if (page === 1) return { items: [{ id: '1' }, { id: '2' }], total: 5, page: 1, limit: 2 };
      if (page === 2) return { items: [{ id: '3' }, { id: '4' }], total: 5, page: 2, limit: 2 };
      return { items: [{ id: '5' }], total: 5, page: 3, limit: 2 };
    };

    const items: { id: string }[] = [];
    for await (const item of paginate(fetcher, { limit: 2 }, 'items')) {
      items.push(item);
    }

    expect(items).toHaveLength(5);
    expect(items.map((i) => i.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(callCount).toBe(3);
  });

  it('should handle empty results', async () => {
    const fetcher = async (_p: { page?: number; limit?: number }) => ({
      messages: [] as { id: string }[],
      total: 0,
      page: 1,
      limit: 100,
    });

    const items: { id: string }[] = [];
    for await (const item of paginate(fetcher, {}, 'messages')) {
      items.push(item);
    }

    expect(items).toEqual([]);
  });

  it('should pass through extra params to fetcher', async () => {
    let receivedParams: Record<string, unknown> = {};
    const fetcher = async (p: { page?: number; limit?: number; status?: string }) => {
      receivedParams = p;
      return { messages: [], total: 0, page: 1, limit: 100 };
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _item of paginate(fetcher, { status: 'delivered' }, 'messages')) {
      // empty
    }

    expect(receivedParams).toMatchObject({ status: 'delivered', page: 1, limit: 100 });
  });

  it('should stop when items.length < limit even if total is higher', async () => {
    let callCount = 0;
    const fetcher = async (_p: { page?: number; limit?: number }) => {
      callCount++;
      return { items: [{ id: '1' }], total: 100, page: 1, limit: 10 };
    };

    const items: { id: string }[] = [];
    for await (const item of paginate(fetcher, { limit: 10 }, 'items')) {
      items.push(item);
    }

    expect(items).toHaveLength(1);
    expect(callCount).toBe(1);
  });
});
