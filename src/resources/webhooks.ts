import type { iSnapClient } from '../client.js';
import type { Webhook, CreateWebhookParams } from '../types.js';

export class WebhooksResource {
  constructor(private client: iSnapClient) {}

  /**
   * Register a new webhook endpoint.
   *
   * @param params - Webhook URL and optional event filter
   * @returns The created webhook (includes the `secret` for signature verification)
   *
   * @example
   * ```ts
   * const wh = await client.webhooks.create({
   *   url: 'https://example.com/webhooks/isnap',
   *   events: ['message.sent', 'message.delivered'],
   * });
   * console.log(wh.secret); // save this for verification
   * ```
   */
  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client.request<Webhook>('POST', '/v1/webhooks', params);
  }

  /**
   * List all registered webhooks.
   *
   * @returns Object containing the webhooks array
   *
   * @example
   * ```ts
   * const { webhooks } = await client.webhooks.list();
   * ```
   */
  async list(): Promise<{ webhooks: Webhook[] }> {
    return this.client.request<{ webhooks: Webhook[] }>('GET', '/v1/webhooks');
  }

  /**
   * Delete a webhook by ID.
   *
   * @param webhookId - The webhook ID to delete
   * @throws {iSnapError} If the webhook is not found
   *
   * @example
   * ```ts
   * await client.webhooks.delete('wh-abc123');
   * ```
   */
  async delete(webhookId: string): Promise<void> {
    return this.client.request<void>('DELETE', `/v1/webhooks/${webhookId}`);
  }
}
