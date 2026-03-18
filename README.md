# @isnap/sdk

[![CI](https://github.com/isnap-dev/isnap-node/actions/workflows/ci.yml/badge.svg)](https://github.com/isnap-dev/isnap-node/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@isnap/sdk.svg)](https://www.npmjs.com/package/@isnap/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official Node.js/TypeScript SDK for the [iSnap](https://isnap.dev) messaging API. Zero runtime dependencies.

## Why iSnap?

Most messaging APIs route through A2P (Application-to-Person) infrastructure — virtual numbers, carrier filters, 10DLC registration, and per-message fees. The result: **30-60% of messages get blocked before they reach the recipient.**

iSnap is different. It's a **Hardware-as-a-Service telephony platform** that provisions real physical devices (iPhones and Androids) with real SIM cards. Your messages travel as P2P (peer-to-peer) — the same way a human sends a text.

### What this means for developers

| | Traditional A2P (Twilio, Vonage) | iSnap (P2P) |
|---|---|---|
| **iMessage** | Not available | Native iMessage from real iPhones |
| **Delivery rate** | ~40-70% (carrier filtering) | ~95%+ (P2P treatment) |
| **Registration** | 10DLC, toll-free verification, weeks of setup | None — instant activation |
| **Pricing** | Per-message fees | Flat monthly per line |
| **WhatsApp** | Business API with 24h windows and templates | Personal WhatsApp — no restrictions |
| **Carrier filtering** | Subject to A2P filters | Bypasses filters — messages look human |

### Built for integrators

iSnap is SDK-first. Whether you're building a CRM, an AI agent, or a custom messaging workflow — embed the SDK and give your users access to P2P lines without managing any hardware.

```
Your App → iSnap SDK → iSnap API → Real Device → Recipient
```

---

## Installation

```bash
npm install @isnap/sdk
```

## Quick Start

```ts
import { init } from '@isnap/sdk';

const client = init({ apiKey: 'isnap_your_api_key' });

const msg = await client.messages.send({
  line_id: 'ln-1',
  to: '+15551234567',
  body: 'Hello from iSnap!',
});

console.log(msg.id, msg.status);
```

## Messages

```ts
// Send a message
const msg = await client.messages.send({
  line_id: 'ln-1',
  to: '+15551234567',
  body: 'Hello!',
  channel: 'sms',              // optional: 'auto' | 'imessage' | 'sms' | 'whatsapp'
  webhook_url: 'https://...',  // optional: delivery status callback
  metadata: { order_id: '42' },
});

// Get a message by ID
const message = await client.messages.get('msg-abc123');

// List messages with filters
const { messages, total } = await client.messages.list({
  status: 'delivered',
  direction: 'outbound',
  page: 1,
  limit: 50,
});

// List conversations
const { conversations } = await client.messages.listConversations({
  line_id: 'ln-1',
});

// Get a full conversation thread
const thread = await client.messages.getConversation('conv-abc123', {
  page: 1,
  limit: 25,
});
console.log(thread.conversation.contact_number);
console.log(thread.messages);
```

## Lines

```ts
// List lines with filters
const { lines } = await client.lines.list({
  type: 'iphone',
  area_code: '415',
});

// Get a line by ID
const line = await client.lines.get('ln-abc123');
console.log(line.phone_number, line.status);
```

## Webhooks

### Managing webhook endpoints

```ts
// Create a webhook
const wh = await client.webhooks.create({
  url: 'https://example.com/webhooks/isnap',
  events: ['message.sent', 'message.delivered', 'message.received'],
});
// Save wh.secret for signature verification

// List webhooks
const { webhooks } = await client.webhooks.list();

// Delete a webhook
await client.webhooks.delete('wh-abc123');
```

### Receiving webhooks

Use `parseWebhook` to verify signatures and get typed events in one call:

```ts
import { parseWebhook } from '@isnap/sdk';
// or: import { parseWebhook } from '@isnap/sdk/webhooks';

app.post('/webhooks/isnap', express.text({ type: '*/*' }), (req, res) => {
  const { verified, event } = parseWebhook({
    secret: process.env.WEBHOOK_SECRET!,
    signature: req.headers['x-isnap-signature'] as string,
    timestamp: req.headers['x-isnap-timestamp'] as string,
    body: req.body,
  });

  if (!verified) return res.status(401).send('Invalid signature');

  switch (event.event) {
    case 'message.sent':
      console.log('Sent:', event.data.id);
      break;
    case 'message.delivered':
      console.log('Delivered:', event.data.id);
      break;
    case 'message.received':
      console.log('Inbound:', event.data.from_number, event.data.body);
      break;
    case 'message.read':
      console.log('Read:', event.data.id);
      break;
    case 'message.failed':
      console.log('Failed:', event.data.id, event.data.error_message);
      break;
  }

  res.sendStatus(200);
});
```

You can also verify signatures manually:

```ts
import { verifyWebhookSignature } from '@isnap/sdk';

const valid = verifyWebhookSignature(
  secret,
  req.headers['x-isnap-signature'],
  req.headers['x-isnap-timestamp'],
  req.body,
);
```

## Pagination

Use the `paginate` async generator to iterate over large collections:

```ts
import { init, paginate } from '@isnap/sdk';

const client = init({ apiKey: 'isnap_your_key' });

// Iterate over all delivered messages
for await (const msg of paginate(
  (p) => client.messages.list(p),
  { status: 'delivered' },
  'messages',
)) {
  console.log(msg.id, msg.body);
}

// Iterate over all conversations
for await (const conv of paginate(
  (p) => client.messages.listConversations(p),
  { line_id: 'ln-1' },
  'conversations',
)) {
  console.log(conv.contact_number, conv.message_count);
}
```

## Error Handling

```ts
import { iSnapError, RateLimitError } from '@isnap/sdk';

try {
  await client.messages.send({ line_id: 'ln-1', to: '+15551234567', body: 'Hello' });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Rate limited — retry after ${err.retryAfter}s`);
  } else if (err instanceof iSnapError) {
    console.log(`API error ${err.statusCode}: ${err.message} (${err.code})`);
  }
}
```

### Retry configuration

The client automatically retries on 429 responses. Customize the behavior:

```ts
const client = init({
  apiKey: 'isnap_your_key',
  maxRetries: 5,        // default: 3
  retryDelayMs: 2000,   // default: 5000 (fallback when no Retry-After header)
});
```

## TypeScript

All types are exported from the main entry point:

```ts
import type {
  Message,
  SendMessageParams,
  Line,
  Webhook,
  Conversation,
  ConversationThreadResponse,
  WebhookEvent,
  WebhookEventType,
  MessageSentEvent,
  iSnapConfig,
} from '@isnap/sdk';
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
