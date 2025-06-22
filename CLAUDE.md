# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands (from repository root)
- `bun dev` - Start all applications in development mode
- `bun build` - Build all applications for production
- `bun lint` - Lint all applications
- `bun format` - Format code with Prettier

### Main Web App (`apps/www/`)
- `bun dev` - Start development server with Turbopack
- `bun build` - Fast production build (no linting)
- `bun build:full` - Full production build with linting
- `bun typecheck` - Run TypeScript type checking
- `bun lint` - Run ESLint
- `bun lint:fix` - Auto-fix ESLint issues

### API App (`apps/api/`) - Port 5100
- `bun dev` - Development server
- `bun build` - Production build

### Docs App (`apps/docs/`) - Port 3001
- `bun dev` - Development server
- `bun build:full` - Full build with linting

## Architecture Overview

### Monorepo Structure
- **Technology**: Turborepo with bun workspaces
- **Node Version**: >=20 required
- **TypeScript**: v5.8.3 (strict mode)
- **Package Manager**: bun v1.2.17

### Key Applications
1. **`apps/www/`** - Main Next.js web application (v4.1.0)
   - Multi-model AI chat interface
   - User authentication and account management
   - Real-time chat with streaming responses
   - Canvas/coding environment integration
   - Internationalization (English/Japanese)

2. **`apps/api/`** - Backend API application
   - User dashboard and billing system
   - Authentication endpoints
   - Stripe integration for payments
   - API key management

3. **`apps/docs/`** - Documentation site
   - Blog and release notes
   - Setup guides and contribution docs

### Shared Packages
- `@workspace/ui` - Shared UI components
- `@workspace/eslint-config` - ESLint configuration
- `@workspace/typescript-config` - TypeScript configuration
- `@workspace/supabase-config` - Supabase configuration
- `voids-ap-provider` / `voids-oai-provider` - Custom AI providers

## Core Architecture Patterns

### AI Integration
- **Multi-Provider Support**: OpenAI, Anthropic, Google, xAI, Groq, OpenRouter
- **Streaming Responses**: Using AI SDK with resumable streams
- **Usage Tracking**: Optimized performance with caching and single-query fetching
- **Tool Calling**: Custom tools for enhanced AI capabilities

### Database & Authentication
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Tables**: `chat_streams`, `intellipulse_action_keys`, `uses`
- **Authentication**: Multi-factor authentication support
- **Performance**: Optimized indexes and query patterns (see `docs/USAGE_OPTIMIZATION.md`)

### Frontend Architecture
- **Next.js 15+**: App Router with TypeScript
- **React 19**: Latest React features
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS v4.x
- **State Management**: React context and local storage hooks

### Key Features
- **Intellipulse**: Advanced coding assistant with WebContainer integration
- **Hubs**: Collaborative spaces for team discussions
- **Canvas**: Code editing and execution environment
- **Deep Research**: Web search integration with Brave Search API
- **Bots**: Custom AI assistants with specific prompts

## Performance Optimizations

### Usage Tracking System
- **Problem Solved**: N+1 query problem in usage tracking
- **Solution**: Single query for all model usage data
- **Caching**: 5-minute TTL with automatic cache invalidation
- **Performance Gain**: 10-50x faster queries, 95% cache hit improvement

### Database Indexes
Key optimized indexes in `scripts/optimize-uses-table-indexes.sql`:
```sql
CREATE INDEX idx_uses_user_date ON uses (user_id, date);
CREATE INDEX idx_uses_user_model_date ON uses (user_id, model, date);
```

## Development Guidelines

### Code Quality Requirements
- Follow existing code patterns and conventions
- Use shared workspace configurations for ESLint and TypeScript
- Maintain strict TypeScript mode
- Avoid ScrollArea component (known bugs)

### Technology Stack Constraints
- **No Version Changes**: Do not modify versions in package.json without approval
- **UI/UX Changes**: Require explicit approval before making design changes
- **Dependency Management**: Check existing usage before introducing new libraries

### File Organization
- **Components**: Place in appropriate `components/` directories
- **Types**: Use shared type definitions in `types/` directories
- **Utils**: Utilize existing utility functions in `lib/` directories
- **API Routes**: Follow Next.js App Router conventions

## Environment Variables

### Required for Development
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
XAI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

# Optional
BRAVE_SEARCH_API_KEY=
UPLOADTHING_TOKEN=
REDIS_URL=
```

## Key Development Workflows

### Adding New AI Models
1. Update model configuration in `lib/modelDescriptions.ts`
2. Add provider setup in relevant API routes
3. Update usage tracking in `lib/usage.ts`
4. Test streaming and tool calling capabilities

### Database Changes
1. Create migration files in `supabase/migrations/`
2. Update corresponding scripts in `scripts/`
3. Test performance impact with usage optimization patterns

### UI Component Development
1. Use `@workspace/ui` for shared components
2. Follow Radix UI patterns for accessibility
3. Implement both light and dark theme support
4. Ensure mobile responsiveness

## Testing and Quality Assurance

### Pre-commit Checks
- Run `bun typecheck` for TypeScript errors
- Run `bun lint` for code quality
- Test build process with `bun build`
- Verify database migrations work correctly

### Performance Monitoring
- Monitor usage tracking query performance
- Check WebContainer integration functionality
- Verify streaming response performance
- Test real-time features with Supabase