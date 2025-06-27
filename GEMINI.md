# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Development Commands

### Package Management
- **Package Manager**: Bun (v1.2.17)
- **Install dependencies**: `bun install`

### Development & Build
- **Start development server**: `bun dev` (runs all apps with Turbo)
- **Build all apps**: `bun build`
- **Lint all code**: `bun lint`
- **Format code**: `bun format`
  
### App-specific Commands (in apps/www/)
- **Start www app only**: `bun dev --turbopack`
- **Build www app**: `bun build`
- **Lint www app**: `bun lint`

### Type Checking
- **Type check**: `bun check-types` (defined in turbo.json)

## Architecture Overview

### Monorepo Structure
- **Framework**: Turborepo with Bun workspaces
- **Apps**: `apps/www` (main Next.js app), `apps/docs` (documentation)
- **Packages**: Shared configs, UI components, and AI providers in `packages/`

### Main Application (apps/www)
- **Framework**: Next.js 15.3.4 with App Router
- **UI**: React 19.1.0 + Tailwind CSS 4.x + shadcn/ui components
- **Database**: Supabase (PostgreSQL) with authentication
- **AI Integration**: Vercel AI SDK 4.3.x supporting multiple providers:
  - OpenAI, Anthropic, Google, Groq, XAI, OpenRouter
  - Custom Voids.top providers
- **File Uploads**: UploadThing integration
- **Search**: Brave Search API integration

### Route Structure (App Router)
- **`(chat)/`**: Chat interface, bot management (`/chat/[id]`, `/bots/`)
- **`(info)/`**: Marketing pages (`/features/`, `/more/`)
- **`api/`**: API routes for chat, bots, conversations, user management
- **`auth/`**: Authentication pages

### Key Providers & Context
- **SupabaseProvider**: Database and auth
- **ConversationsProvider**: Chat state management
- **CanvasProvider**: Canvas mode functionality
- **SidebarProvider**: UI state
- **ThemeProvider**: Dark/light mode support

## Development Guidelines

### Critical Restrictions
- **No UI/UX changes** without explicit approval (layout, colors, fonts, spacing)
- **No version changes** to technology stack without approval
- **Do not use ScrollArea component** (known bugs - use alternatives)
- **No arbitrary changes** - only implement what's explicitly requested

### Code Conventions
- **TypeScript**: Strict typing required (^5.8.3)
- **Components**: Follow shadcn/ui patterns, use workspace UI package
- **Styling**: Tailwind CSS 4.x classes, maintain design system consistency
- **AI Integration**: Use Vercel AI SDK patterns for streaming responses
- **Database**: Use Supabase client patterns with proper RLS policies

### Commit Messages
Use conventional commit format:
- `feat: [description]` - New features
- `fix: [description]` - Bug fixes  
- `docs: [description]` - Documentation
- `style: [description]` - Styling changes
- `refactor: [description]` - Code refactoring
- `test: [description]` - Tests
- `chore: [description]` - Maintenance

### Task Execution Process
1. **Analysis**: Identify requirements, check for existing functionality
2. **Planning**: Determine implementation steps and execution order
3. **Implementation**: Execute step-by-step with progress reports
4. **Quality Control**: Verify results, fix issues if found
5. **Final Review**: Ensure consistency and no duplication

## Important File Locations

### Configuration
- `turbo.json` - Turborepo configuration
- `apps/www/next.config.ts` - Next.js configuration
- `apps/www/tailwind.config.ts` - Tailwind configuration
- `apps/www/components.json` - shadcn/ui configuration

### Core Directories
- `apps/www/src/app/(chat)/` - Chat interface and bot management
- `apps/www/src/components/` - React components
- `apps/www/src/lib/` - Utility functions and configurations
- `packages/ui/` - Shared UI components
- `supabase/` - Database schema and migrations

### Environment Variables
Required variables in `apps/www/.env`:
- AI provider keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- Supabase config (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Service keys (BRAVE_SEARCH_API_KEY, UPLOADTHING_TOKEN)

## Notes
- Development server is typically already running - avoid starting additional servers
- Project uses Bun for package management - prefer `bun` over `npm`
- Main branch is `canary`, current work is on `updates/rewrite` branch
- All AI providers are optional - configure only what's needed
- Supabase handles authentication, database, and RLS policies