import type { iSnapClient } from '../client.js';
import type { Line, ListLinesParams, ListLinesResponse } from '../types.js';

export class LinesResource {
  constructor(private client: iSnapClient) {}

  /**
   * List phone lines with optional filters and pagination.
   *
   * @param params - Optional filters (type, area_code) and pagination
   * @returns Paginated list of lines
   *
   * @example
   * ```ts
   * const { lines } = await client.lines.list({ type: 'iphone', limit: 10 });
   * ```
   */
  async list(params?: ListLinesParams): Promise<ListLinesResponse> {
    const query: Record<string, string> = {};
    if (params?.type) query.type = params.type;
    if (params?.area_code) query.area_code = params.area_code;
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);

    return this.client.request<ListLinesResponse>('GET', '/lines', undefined, query);
  }

  /**
   * Retrieve a single line by ID.
   *
   * @param lineId - The line ID
   * @returns The line
   * @throws {iSnapError} If the line is not found
   *
   * @example
   * ```ts
   * const line = await client.lines.get('ln-abc123');
   * console.log(line.phone_number);
   * ```
   */
  async get(lineId: string): Promise<Line> {
    return this.client.request<Line>('GET', `/lines/${lineId}`);
  }
}
