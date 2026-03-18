/**
 * Generic async generator that paginates over any SDK list endpoint.
 *
 * Yields individual items from each page until all pages have been consumed.
 *
 * @param fetcher - A function that accepts `{ page, limit }` and returns a paginated response
 * @param params - Initial pagination parameters (defaults: `page = 1`, `limit = 100`)
 * @param dataKey - The key in the response object that holds the array of items
 *
 * @example
 * ```ts
 * import { init, paginate } from '@isnap/sdk';
 *
 * const client = init({ apiKey: 'isnap_your_key' });
 *
 * for await (const msg of paginate(
 *   (p) => client.messages.list(p),
 *   { status: 'delivered' },
 *   'messages',
 * )) {
 *   console.log(msg.id, msg.body);
 * }
 * ```
 */
export async function* paginate<
  TItem,
  TParams extends { page?: number; limit?: number },
  TKey extends string,
>(
  fetcher: (params: TParams) => Promise<{ total: number; page: number; limit: number } & Record<TKey, TItem[]>>,
  params: TParams,
  dataKey: TKey,
): AsyncGenerator<TItem, void, undefined> {
  let page = params.page ?? 1;
  const limit = params.limit ?? 100;

  while (true) {
    const response = await fetcher({ ...params, page, limit } as TParams);
    const items = response[dataKey];

    for (const item of items) {
      yield item;
    }

    if (items.length < limit || page * limit >= response.total) {
      break;
    }

    page++;
  }
}
