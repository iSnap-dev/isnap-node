# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## 0.1.0 — 2026-03-18

### Added

- `iSnapClient` with automatic rate-limit retries and configurable retry settings.
- `MessagesResource` — send, get, list messages; list conversations and conversation threads.
- `LinesResource` — list and get phone lines.
- `WebhooksResource` — create, list, and delete webhook endpoints.
- `verifyWebhookSignature` — HMAC-SHA256 webhook signature verification.
- `parseWebhook` — verify + parse webhook payloads into typed events.
- `paginate` — async generator for automatic pagination over collections.
- Typed webhook events: `message.sent`, `message.delivered`, `message.read`, `message.failed`, `message.received`.
- Full TypeScript type exports for all request/response shapes.
- Zero runtime dependencies.
