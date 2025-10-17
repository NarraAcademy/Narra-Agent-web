# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Narra Agent is an AI-powered cryptocurrency investment assistant built with Next.js 15 (App Router), TypeScript, and React 19. The application provides real-time market analysis, professional investment insights, and an intelligent chatbot interface powered by AI models.

## Development Commands

### Essential Commands
```bash
# Development
pnpm dev                    # Start development server with Turbopack
PORT=3000 pnpm dev          # Start on specific port

# Build & Production
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm analyze                # Analyze bundle size

# Database (Drizzle ORM)
pnpm db:generate            # Generate migrations
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Drizzle Studio
pnpm db:push                # Push schema changes
```

### Environment Setup
```bash
cp .env.example .env.development    # Development environment
cp .env.example .env.production     # Production environment
```

## Architecture & Key Patterns

### Route Group Structure
The app uses Next.js 15 App Router with **route groups** for layout isolation:

- `(default)/`: Main layout with Header + Footer (marketing pages, pricing, etc.)
- `(chat)/`: Chat interface layout **without** Header/Footer (clean chat UI)
- `(admin)/`: Admin panel layout
- `(docs)/`: Documentation layout (fumadocs)
- `(console)/`: User console/dashboard layout
- `(legal)/`: Legal pages layout

**Critical**: Each route group has its own `layout.tsx`. The root `[locale]/layout.tsx` only provides Providers (NextIntl, NextAuth, Theme), not UI elements.

### Internationalization Architecture

**Multi-level i18n system** using next-intl:

1. **Global Messages** (`src/i18n/messages/{locale}.json`)
   - Navigation, user menu, feedback, chat UI
   - Usage: `const t = useTranslations("chat")`

2. **Page-specific Messages** (`src/i18n/pages/{page}/{locale}.json`)
   - Landing page, pricing, showcase content
   - Usage: Loaded in page components, accessed via `getTranslations()`

**Language Support**: `zh` (Chinese), `en` (English)

**URL Pattern**: `/{locale}/...` (e.g., `/zh/pricing`, `/en/chat`)

### State Management

**React Context Pattern** - Two main contexts:

1. **AppContext** (`src/contexts/app.tsx`)
   - Global app state (user, auth, modals)
   - User authentication state (NextAuth integration)
   - Sign-in modal control, feedback modal
   - Invite code handling (localStorage-based)

2. **ChatContext** (`src/components/chat/chat-context.tsx`)
   - Chat-specific state management
   - Conversation history (localStorage persistence)
   - Message CRUD operations
   - Loading states for AI responses

**Key Pattern**: Context providers are nested in `[locale]/layout.tsx`:
```tsx
<NextIntlClientProvider>
  <NextAuthSessionProvider>
    <AppContextProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AppContextProvider>
  </NextAuthSessionProvider>
</NextIntlClientProvider>
```

### Component Architecture

**Block Components** (`src/components/blocks/`)
- Reusable layout blocks for landing pages
- Header, Footer, Hero, Features, Pricing, etc.
- Each block has TypeScript types in `src/types/blocks/`
- Configured via i18n JSON files

**UI Components** (`src/components/ui/`)
- Shadcn/ui primitives
- Radix UI components with Tailwind styling
- Button, Dialog, Dropdown, Toast (sonner), etc.

**Chat Components** (`src/components/chat/`)
- Self-contained chat feature with own context
- Components: ChatLayout, ChatConversation, ChatMessage, ChatInput, ChatSidebar
- Uses SSE (Server-Sent Events) for streaming AI responses
- localStorage for conversation persistence

### API Routes Structure

Located in `src/app/api/`:

- **Authentication**: `/api/auth/*` (NextAuth endpoints)
- **User Management**: `/api/get-user-info`, `/api/update-invite`
- **Payments**: `/api/checkout` (Stripe integration)
- **Chat**: `/api/chat` (SSE streaming endpoint for AI responses)

**API Response Pattern**:
```typescript
{
  code: 0 | 1,      // 0 = success, 1 = error
  message: string,
  data: any
}
```

### Database (Drizzle ORM)

**Configuration**: `src/db/config.ts`
**Schema**: `src/db/schema.ts`
**Connection**: `src/db/index.ts`

Uses PostgreSQL with Drizzle ORM. Migration workflow:
1. Update schema in `schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply
4. Use `pnpm db:studio` for GUI exploration

### Styling System

**Tailwind CSS 4** + **Shadcn/ui**

- Theme configuration: `src/app/theme.css`
- CSS variables for colors (light/dark mode support)
- Use `cn()` utility from `@/lib/utils` for class merging
- **Critical for Tailwind**: Never use template literals for dynamic classes (e.g., `md:grid-cols-${n}`). Use conditional rendering with complete class names:
  ```tsx
  // ❌ Wrong - doesn't compile
  className={`grid md:grid-cols-${count}`}

  // ✅ Correct
  className={cn(
    "grid",
    count === 3 && "md:grid-cols-3",
    count === 4 && "md:grid-cols-4"
  )}
  ```

### Authentication Flow

**NextAuth v5** (`next-auth@5.0.0-beta.25`)

- Providers: Email, Google, GitHub
- Session handling in AppContext
- Google One Tap login support (configurable)
- Auth checks: `isAuthEnabled()`, `isGoogleOneTapEnabled()`

## Important Conventions

### Brand & Naming
- **Brand Name**: "Narra Agent" 
- Used in all user-facing content, metadata, i18n files

### File Naming
- Components: PascalCase (e.g., `ChatMessage.tsx`)
- Utilities/libs: camelCase (e.g., `cache.ts`)
- Types: PascalCase interfaces (e.g., `User`, `Message`)

### Type Safety
- All components must have proper TypeScript types
- Use types from `src/types/` for shared interfaces
- Define component props with explicit types

### Data Flow Patterns
- **Models** (`src/models/`): Database operations and data access
- **Services** (`src/services/`): Business logic layer
- **Lib** (`src/lib/`): Utility functions and helpers

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Use `md:`, `lg:` prefixes for larger screens
- **Never use fixed width/height** - let content dictate size
- **Never use absolute positioning** for layout

## Key Integration Points

### AI Integration
- Multiple AI provider support (OpenAI, DeepSeek, OpenRouter)
- Streaming responses using Server-Sent Events (SSE)
- Chat API at `/api/chat` returns SSE stream with format:
  ```
  data: {"event": "report_chunk", "data": {"content": "..."}}
  data: {"event": "complete", "data": {"final_report": "..."}}
  ```

### Payment Integration (Stripe)
- Checkout flow: `/api/checkout` → Stripe → redirect
- Product IDs configured in pricing JSON files
- Subscription management via Stripe dashboard

### Analytics
- OpenPanel integration (`@openpanel/nextjs`)
- Event tracking throughout the app

## Development Notes

### Hot Reload
Development server uses Turbopack for fast refresh. If you encounter caching issues:
```bash
rm -rf .next
pnpm dev
```

### Common Issues
1. **Dynamic Tailwind classes not working**: Use conditional rendering with complete class names
2. **Layout leaked into chat route**: Check route group structure - chat should be in `(chat)/`
3. **i18n not loading**: Ensure locale is in URL path and messages files exist
4. **localStorage errors**: Wrap in `typeof window !== 'undefined'` check

### Testing API Endpoints
Use files in `debug/` directory (e.g., `apitest.http`) with REST client extensions.

## Technology Stack

**Core**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4
**Auth**: NextAuth v5
**Database**: PostgreSQL + Drizzle ORM
**UI**: Shadcn/ui, Radix UI, Framer Motion
**Payments**: Stripe
**AI**: Vercel AI SDK, OpenAI, DeepSeek
**i18n**: next-intl
**Docs**: Fumadocs (MDX-based documentation)
