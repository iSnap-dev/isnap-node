# Contributing to iSnap Node SDK

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/isnap-dev/isnap-node.git
cd isnap-node

# Install dependencies
npm install

# Run tests
npm test

# Type-check
npm run typecheck

# Build
npm run build
```

## Making Changes

1. Fork the repo and create a branch from `main`.
2. Make your changes — add tests for any new functionality.
3. Ensure `npm test` and `npm run typecheck` pass.
4. Submit a pull request.

## Code Style

- TypeScript strict mode is enabled.
- Use `.js` extensions in all import paths (required for ESM resolution).
- No runtime dependencies — the SDK must stay zero-dependency.
- Export all public types from `src/index.ts`.

## Tests

Tests use [Vitest](https://vitest.dev/) and mock `fetch` — no network calls are made.

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run a specific test file
npx vitest run src/client.test.ts
```

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Include tests for new functionality.
- Update the README if you're adding or changing public API.
- Add a CHANGELOG entry under `## Unreleased`.

## Reporting Issues

Use [GitHub Issues](https://github.com/isnap-dev/isnap-node/issues) to report bugs or request features. Please include:

- SDK version (`npm list @isnap/sdk`)
- Node.js version (`node -v`)
- Minimal reproduction steps

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
