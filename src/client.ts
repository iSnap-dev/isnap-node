import { iSnapError, RateLimitError } from './types.js';
import type { iSnapConfig } from './types.js';
import { MessagesResource } from './resources/messages.js';
import { LinesResource } from './resources/lines.js';
import { WebhooksResource } from './resources/webhooks.js';

/**
 * The iSnap SDK client. Provides access to all API resources.
 *
 * @example
 * ```ts
 * import { init } from '@isnap/sdk';
 *
 * const client = init({ apiKey: 'isnap_your_key' });
 * const msg = await client.messages.send({ line_id: 'ln-1', to: '+15551234567', body: 'Hello' });
 * ```
 */
export class iSnapClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;

  /** Message sending, retrieval, and conversation management. */
  public messages: MessagesResource;
  /** Phone line listing and lookup. */
  public lines: LinesResource;
  /** Webhook endpoint management. */
  public webhooks: WebhooksResource;

  constructor(config: iSnapConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://api.isnap.dev').replace(/\/$/, '');
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 5000;

    this.messages = new MessagesResource(this);
    this.lines = new LinesResource(this);
    this.webhooks = new WebhooksResource(this);
  }

  /**
   * Send an HTTP request to the iSnap API.
   *
   * Handles authorization, JSON serialization, rate-limit retries, and error mapping.
   *
   * @param method - HTTP method (GET, POST, DELETE, etc.)
   * @param path - API path (e.g. `/v1/messages`)
   * @param body - Optional request body (will be JSON-stringified)
   * @param query - Optional query parameters
   * @returns Parsed JSON response
   * @throws {iSnapError} On non-2xx responses
   * @throws {RateLimitError} When rate-limited after exhausting retries
   */
  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') params.set(key, value);
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: this.apiKey,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get('Retry-After');
        const retryAfter = retryAfterHeader !== null
          ? parseInt(retryAfterHeader, 10)
          : this.retryDelayMs / 1000;
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw new RateLimitError(`Rate limit exceeded`, retryAfter);
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new iSnapError(
          err.message || `HTTP ${res.status}`,
          res.status,
          err.code,
        );
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    }

    throw new iSnapError('Max retries exceeded', 429);
  }
}

/**
 * Create a new iSnap SDK client.
 *
 * @param config - API key and optional settings
 * @returns A configured {@link iSnapClient} instance
 *
 * @example
 * ```ts
 * import { init } from '@isnap/sdk';
 *
 * const client = init({
 *   apiKey: 'isnap_your_key',
 *   maxRetries: 5,
 *   retryDelayMs: 2000,
 * });
 * ```
 */
export function init(config: iSnapConfig): iSnapClient {
  return new iSnapClient(config);
}
