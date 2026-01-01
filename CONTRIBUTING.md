# Contributing to Deni AI

Thank you for your interest in contributing to Deni AI! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We expect all contributors to adhere to these guidelines to maintain a welcoming and inclusive community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a new branch for your feature or fix

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (preferred) or Node.js 20+
- PostgreSQL database (we recommend [Neon](https://neon.tech/) for serverless PostgreSQL)
- Stripe account (for billing features)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/deni-ai.git
cd deni-ai

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up the database
bun run db:migrate

# Start the development server
bun dev
```

### Environment Variables

Refer to `src/env.ts` for the complete list of required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection URL
- `BETTER_AUTH_SECRET` - 32-character authentication secret
- AI provider keys (OpenAI, Anthropic, Google)
- Stripe keys for billing

## How to Contribute

### Types of Contributions

- **Bug fixes**: Help us squash bugs and improve stability
- **Features**: Propose and implement new features
- **Documentation**: Improve docs, fix typos, add examples
- **Tests**: Add or improve test coverage
- **Performance**: Optimize code and improve performance

### Before You Start

1. Check existing [issues](https://github.com/YOUR_ORG/deni-ai/issues) and [pull requests](https://github.com/YOUR_ORG/deni-ai/pulls)
2. For major changes, open an issue first to discuss your proposal
3. Ensure your contribution aligns with the project's goals

## Pull Request Process

1. **Create a branch**: Use a descriptive name like `feature/add-new-provider` or `fix/chat-loading-issue`

2. **Make your changes**: Follow the coding standards below

3. **Test your changes**:
   ```bash
   bun run lint      # Check for linting errors
   bun run format    # Format code
   bun run build     # Ensure build passes
   ```

4. **Commit your changes**: Write clear, concise commit messages
   ```
   feat: add support for new AI provider
   fix: resolve chat message ordering issue
   docs: update API documentation
   ```

5. **Push and create a Pull Request**:
   - Provide a clear description of your changes
   - Reference any related issues
   - Include screenshots for UI changes

6. **Code review**: Address feedback from maintainers

## Coding Standards

### TypeScript

- Use strict TypeScript (enabled by default)
- Avoid `any` - use `unknown` and type guards when needed
- Leverage type inference from tRPC and Drizzle

### Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `bun run lint` and `bun run format` before committing
- Follow existing patterns in the codebase

### File Naming

- Use kebab-case for files: `auth-client.ts`, `chat-interface.tsx`
- Use the `@/*` import alias for clean imports

### React Patterns

- Server Components by default (Next.js App Router)
- Use `"use client"` only when necessary
- Follow React Compiler constraints

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, browser, Node/Bun version)
- Screenshots or logs if applicable

### Feature Requests

When requesting features, please include:

- A clear description of the feature
- The problem it solves
- Potential implementation approaches (optional)
- Examples from other projects (if applicable)

## Questions?

If you have questions, feel free to:

- Open a [Discussion](https://github.com/YOUR_ORG/deni-ai/discussions)
- Check existing documentation
- Reach out to maintainers

Thank you for contributing to Deni AI!
