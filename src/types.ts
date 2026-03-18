// ── Message ──────────────────────────────────────────────────────────────────

/** A message sent or received through a line. */
export interface Message {
  id: string;
  line_id: string;
  direction: string;
  from_number: string;
  to_number: string;
  body: string;
  channel: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  metadata: unknown;
  queued_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string;
}

/** Parameters for sending a new message. */
export interface SendMessageParams {
  /** The line ID to send the message from. */
  line_id: string;
  /** Recipient phone number in E.164 format. */
  to: string;
  /** Message body text. */
  body: string;
  /** Messaging channel. Defaults to `'auto'`. */
  channel?: 'auto' | 'imessage' | 'sms' | 'whatsapp';
  /** Optional webhook URL to receive delivery status updates. */
  webhook_url?: string;
  /** Arbitrary key-value metadata attached to the message. */
  metadata?: Record<string, unknown>;
}

/** Filter/pagination parameters for listing messages. */
export interface ListMessagesParams {
  line_id?: string;
  status?: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  direction?: 'outbound' | 'inbound';
  page?: number;
  limit?: number;
}

/** Paginated list of messages. */
export interface ListMessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

// ── Conversation ─────────────────────────────────────────────────────────────

/** A conversation thread between a line and a contact. */
export interface Conversation {
  id: string;
  line_id: string;
  contact_number: string;
  last_message_at: string;
  message_count: number;
  created_at: string;
}

/** Filter/pagination parameters for listing conversations. */
export interface ListConversationsParams {
  line_id?: string;
  page?: number;
  limit?: number;
}

/** Paginated list of conversations. */
export interface ListConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

/** Pagination parameters for retrieving a conversation thread. */
export interface ConversationThreadParams {
  /** Page number (1-based). */
  page?: number;
  /** Number of messages per page. */
  limit?: number;
}

/** A conversation thread with its messages. */
export interface ConversationThreadResponse {
  conversation: Conversation;
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

// ── Line ─────────────────────────────────────────────────────────────────────

/** A phone line (iPhone or Android). */
export interface Line {
  id: string;
  phone_number: string;
  area_code: string;
  type: string;
  capabilities: unknown;
  status: string;
  monthly_price: number;
  activated_at: string | null;
  created_at: string;
}

/** Paginated list of lines. */
export interface ListLinesResponse {
  lines: Line[];
  total: number;
  page: number;
  limit: number;
}

/** Filter/pagination parameters for listing lines. */
export interface ListLinesParams {
  type?: string;
  area_code?: string;
  page?: number;
  limit?: number;
}

// ── Webhook ──────────────────────────────────────────────────────────────────

/** A registered webhook endpoint. */
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  failure_count: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  secret?: string;
}

/** Parameters for creating a webhook. */
export interface CreateWebhookParams {
  /** The URL to receive webhook events. */
  url: string;
  /** Event types to subscribe to. Defaults to all events. */
  events?: string[];
}

// ── Webhook Events ───────────────────────────────────────────────────────────

/** All supported webhook event types. */
export type WebhookEventType =
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  | 'message.received';

/** Base shape shared by all webhook events. */
interface WebhookEventBase {
  webhook_id: string;
  timestamp: string;
}

/** Fired when a message is successfully sent. */
export interface MessageSentEvent extends WebhookEventBase {
  event: 'message.sent';
  data: Message;
}

/** Fired when a message is delivered to the recipient. */
export interface MessageDeliveredEvent extends WebhookEventBase {
  event: 'message.delivered';
  data: Message;
}

/** Fired when a message is read by the recipient. */
export interface MessageReadEvent extends WebhookEventBase {
  event: 'message.read';
  data: Message;
}

/** Fired when a message fails to send. */
export interface MessageFailedEvent extends WebhookEventBase {
  event: 'message.failed';
  data: Message;
}

/** Fired when an inbound message is received. */
export interface MessageReceivedEvent extends WebhookEventBase {
  event: 'message.received';
  data: Message;
}

/** Discriminated union of all webhook event types. Switch on `event.event` for type narrowing. */
export type WebhookEvent =
  | MessageSentEvent
  | MessageDeliveredEvent
  | MessageReadEvent
  | MessageFailedEvent
  | MessageReceivedEvent;

// ── Config ───────────────────────────────────────────────────────────────────

/** Configuration for the iSnap SDK client. */
export interface iSnapConfig {
  /** Your iSnap API key (starts with `isnap_`). */
  apiKey: string;
  /** Override the base API URL. Defaults to `https://api.isnap.dev`. */
  baseUrl?: string;
  /** Maximum number of automatic retries on 429 responses. Defaults to `3`. */
  maxRetries?: number;
  /** Fallback delay in milliseconds between retries when no `Retry-After` header is present. Defaults to `5000`. */
  retryDelayMs?: number;
}

// ── Errors ───────────────────────────────────────────────────────────────────

/** Error returned by the iSnap API. */
export class iSnapError extends Error {
  constructor(
    message: string,
    /** HTTP status code. */
    public statusCode: number,
    /** Machine-readable error code (e.g. `'RATE_LIMITED'`). */
    public code?: string,
  ) {
    super(message);
    this.name = 'iSnapError';
  }
}

/** Thrown when the API returns 429 Too Many Requests after exhausting retries. */
export class RateLimitError extends iSnapError {
  constructor(
    message: string,
    /** Seconds to wait before retrying. */
    public retryAfter: number,
  ) {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}
