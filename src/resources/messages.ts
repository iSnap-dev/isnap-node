import type { iSnapClient } from '../client.js';
import type {
  Message,
  SendMessageParams,
  ListMessagesParams,
  ListMessagesResponse,
  ListConversationsParams,
  ListConversationsResponse,
  ConversationThreadParams,
  ConversationThreadResponse,
} from '../types.js';

export class MessagesResource {
  constructor(private client: iSnapClient) {}

  /**
   * Send a new message.
   *
   * @param params - Message details (line, recipient, body)
   * @returns The created message
   * @throws {iSnapError} On validation or delivery errors
   *
   * @example
   * ```ts
   * const msg = await client.messages.send({
   *   line_id: 'ln-1',
   *   to: '+15551234567',
   *   body: 'Hello from iSnap!',
   * });
   * ```
   */
  async send(params: SendMessageParams): Promise<Message> {
    return this.client.request<Message>('POST', '/v1/messages', params);
  }

  /**
   * Retrieve a single message by ID.
   *
   * @param messageId - The message ID
   * @returns The message
   * @throws {iSnapError} If the message is not found
   *
   * @example
   * ```ts
   * const msg = await client.messages.get('msg-abc123');
   * ```
   */
  async get(messageId: string): Promise<Message> {
    return this.client.request<Message>('GET', `/v1/messages/${messageId}`);
  }

  /**
   * List messages with optional filters and pagination.
   *
   * @param params - Optional filters (line_id, status, direction) and pagination
   * @returns Paginated list of messages
   *
   * @example
   * ```ts
   * const { messages, total } = await client.messages.list({ status: 'delivered', limit: 50 });
   * ```
   */
  async list(params?: ListMessagesParams): Promise<ListMessagesResponse> {
    const query: Record<string, string> = {};
    if (params?.line_id) query.line_id = params.line_id;
    if (params?.status) query.status = params.status;
    if (params?.direction) query.direction = params.direction;
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);

    return this.client.request<ListMessagesResponse>('GET', '/v1/messages', undefined, query);
  }

  /**
   * List all conversations with optional filters and pagination.
   *
   * @param params - Optional line_id filter and pagination
   * @returns Paginated list of conversations
   *
   * @example
   * ```ts
   * const { conversations } = await client.messages.listConversations({ line_id: 'ln-1' });
   * ```
   */
  async listConversations(params?: ListConversationsParams): Promise<ListConversationsResponse> {
    const query: Record<string, string> = {};
    if (params?.line_id) query.line_id = params.line_id;
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);

    return this.client.request<ListConversationsResponse>('GET', '/v1/messages/conversations', undefined, query);
  }

  /**
   * Retrieve a full conversation thread by ID, including its messages.
   *
   * @param conversationId - The conversation ID
   * @param params - Optional pagination for messages within the thread
   * @returns The conversation with paginated messages
   * @throws {iSnapError} If the conversation is not found
   *
   * @example
   * ```ts
   * const thread = await client.messages.getConversation('conv-abc123', { page: 1, limit: 25 });
   * console.log(thread.conversation.contact_number);
   * console.log(thread.messages.length);
   * ```
   */
  async getConversation(conversationId: string, params?: ConversationThreadParams): Promise<ConversationThreadResponse> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);

    return this.client.request<ConversationThreadResponse>(
      'GET',
      `/v1/messages/conversations/${conversationId}`,
      undefined,
      query,
    );
  }
}
