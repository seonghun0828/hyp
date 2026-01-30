# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HYP (Highlight Your Product)** is an AI-powered marketing content generator for makers and solo founders. Users input a product URL, and the system automatically generates promotional content with AI-generated images and marketing copy using the SUCCESs framework (Simple, Unexpected, Concrete, Credible, Emotional, Story).

**Tech Stack:**
- Frontend: Next.js 15 (App Router) + React 19 + TypeScript
- Database: Supabase (PostgreSQL)
- AI APIs: OpenAI (text generation), Google Gemini (image generation)
- State Management: Zustand with IndexedDB persistence
- Styling: Tailwind CSS 4
- i18n: next-intl (Korean/English)
- Deployment: Vercel
- Package Manager: pnpm

## Core Development Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack (localhost:3000)

# Build & Production
pnpm build                  # Production build
pnpm start                  # Start production server

# Type Checking (no test suite yet)
npx tsc --noEmit           # Manual type check
```

## Architecture & Key Concepts

### User Funnel Flow

The app follows a multi-step funnel stored in Zustand with IndexedDB persistence:

1. **URL Input** (`/[locale]`) - User enters product URL
2. **Product Summary** (`/[locale]/summary`) - AI extracts/user edits product info (title, core_value, target_customer, competitive_edge, customer_benefit, etc.)
3. **Style Selection** (`/[locale]/styles`) - User selects 4 style dimensions:
   - Message Type (problem-solving, benefit, comparison, story)
   - Visual Style (photo-realistic, line-drawing, cartoon, illustration)
   - Model Composition (product-only, hands-only, person-only, scene)
   - Aspect Ratio (1:1, 4:5, 16:9)
4. **Image Generation** (`/[locale]/upload`) - AI generates images or user uploads
5. **Marketing Text** - AI generates SUCCESs principle texts (6 variations)
6. **Editor** (`/[locale]/editor`) - User edits text/image layout
7. **Result** (`/[locale]/result`) - Download final PNG

### State Management Architecture

**Global Store** (`lib/store.ts`):
- Uses Zustand with IndexedDB persistence (via `idb-keyval`)
- Stores entire funnel state: `url`, `summary`, `styles`, `imageUrl`, `successTexts`, etc.
- Two stores: `useFunnelStore` (funnel state), `useCreditStore` (user credits)

**Why IndexedDB?**
- Persists large image URLs and generated content across sessions
- Survives browser refreshes
- Better than localStorage for capacity

### Authentication & Credits System

- **Anonymous Users**: Automatic `anon_token` cookie generated in middleware
- **Logged-in Users**: Supabase Auth (optional)
- **Credits**: Each user has credits stored in `user_credits` table
  - Image generation costs 10 credits
  - Text generation costs 1 credit
  - Checked before API calls (`lib/credits.ts`)

### Internationalization (i18n)

- Uses `next-intl` with `localePrefix: 'always'`
- Middleware (`middleware.ts`) detects locale via:
  1. Cookie (`NEXT_LOCALE`)
  2. Vercel geo header (`x-vercel-ip-country`)
  3. Accept-Language header
  4. Defaults to English
- All routes prefixed: `/en/*`, `/ko/*`
- Messages in `messages/{locale}.json`

### AI Prompt Engineering

**Location**: `lib/prompts/`

- `summary.ts` - Product analysis prompts
- `success-text.ts` - SUCCESs framework marketing copy prompts (6 principles)
- `image.ts` - Image generation prompts combining user selections

**Key Pattern**: Prompts dynamically combine:
- Product summary fields (core_value, target_customer, etc.)
- Selected style dimensions (messageType, visualStyle, model)
- Product category metadata (industry, form, purpose)

### Database Schema

**Tables** (see `lib/supabase.ts` for types):
- `product_summaries` - Product analysis results
- `generated_contents` - Generated images + text combinations
- `marketing_text_cache` - Cache for SUCCESs texts (1 hour TTL)
- `user_credits` - Credit balance per user
- `promotion_consents` - Marketing consent tracking
- `quick_feedback` - User feedback

**Note**: Uses Supabase RLS (Row Level Security) for data isolation.

## Key API Routes

All routes in `app/api/`:

- `POST /api/summary` - Analyze product URL (OpenAI)
- `POST /api/generate-image` - Generate promotional image (Gemini)
- `POST /api/generate-success-texts` - Generate 6 SUCCESs texts (OpenAI)
- `POST /api/generate-success-texts-stream` - Streaming version of above
- `POST /api/save-content` - Save final generated content
- `POST /api/upload-image` - Upload user image to Supabase Storage
- `GET /api/credits` - Fetch user credit balance
- `POST /api/check-cache` - Check marketing text cache

## Critical Implementation Details

### Immutability Pattern

**ALWAYS use immutable updates in Zustand:**

```typescript
// ✅ CORRECT
setStyles: (styles) => set({ styles })

// ❌ WRONG
setStyles: (styles) => {
  state.styles = styles  // Mutation!
}
```

### Supabase Client Patterns

**Two patterns** (see `lib/supabase/`):
- **Client-side**: `createBrowserClient()` from `@/lib/supabase/client`
- **Server-side**: `createClient()` from `@/lib/supabase/server` (uses cookies)

**IMPORTANT**:
- Always use server client in API routes and server components
- Always use browser client in client components
- The deprecated `lib/supabase.ts` export is being phased out

### Credit Checking Pattern

**Before expensive operations** (image/text generation):

```typescript
// 1. Check credits (server-side)
const { credits } = await checkUserCredits(cost);
if (!credits) return error;

// 2. Deduct credits
await deductCredits(cost, anonToken);

// 3. Perform operation
const result = await generateImage(...);
```

See `lib/credits.ts` and API routes for implementation.

### Error Handling Strategy

- All API routes return `{ success: boolean, data?, error? }` format
- Client-side errors logged but not exposed to users
- AI API failures return user-friendly Korean/English messages via i18n (`lib/api-messages.ts`)

### Design System & Tokens

**Single Source of Truth**: `docs/design/token.ts`

All design tokens (colors, typography, spacing, radius, motion) are defined in `docs/design/token.ts` and imported directly into `tailwind.config.ts`. This ensures consistency and prevents duplication.

**IMPORTANT**:
- NEVER hardcode color values, sizes, or spacing in components
- Use Tailwind utilities that reference the token system (e.g., `bg-primary-600`, `text-neutral-900`)
- The design system follows HYP's philosophy: calm, tool-like, non-judgmental
- See `.claude/rules/design-system.md` and `.claude/rules/design-tokens.md` for full guidelines

## File Organization

```
app/
  [locale]/           # Localized routes
    page.tsx          # URL input
    summary/          # Product summary edit
    styles/           # Style selection (4 steps)
    upload/           # Image upload/generation
    editor/           # Content editor
    result/           # Final result
  api/                # API routes
lib/
  api/                # API client functions
  categories/         # Product category definitions
  prompts/            # AI prompt templates
  supabase/           # Supabase client configs
  store.ts            # Zustand state management
  concepts.ts         # (Legacy) Previous concept system
  styles.ts           # Style option definitions
  fonts.ts            # Custom font configurations
  credits.ts          # Credit management
  summary.ts          # Summary field definitions
components/           # Reusable UI components
messages/             # i18n translation files
public/images/        # Static assets including style examples
```

## Common Development Patterns

### Adding New API Route

1. Create route in `app/api/{name}/route.ts`
2. Use server-side Supabase client
3. Check credits if AI operation
4. Return standardized response format
5. Add client function in `lib/api/{name}.ts`
6. Add error messages in `lib/api-messages.ts`

### Adding New Funnel Step

1. Create page in `app/[locale]/{step}/page.tsx`
2. Read from `useFunnelStore` state
3. Update store with new data
4. Navigate to next step
5. Ensure middleware handles new route

### Adding New Style Dimension

1. Add options in `lib/styles.ts`
2. Update `Styles` interface in `lib/store.ts`
3. Add selection UI in `app/[locale]/styles/`
4. Update image prompt generation in `lib/prompts/image.ts`

## Environment Variables

Required in `.env` (see `.env.example`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Google Gemini
GEMINI_API_KEY=

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

## Important Notes

- **No test suite yet** - Manual testing only
- **Credit costs**: Text = 1, Image = 10 (configurable in `lib/constants.ts`)
- **Image storage**: Supabase Storage bucket `user-uploads`
- **Cache TTL**: Marketing text cache expires after 1 hour
- **Locale detection**: Prioritizes cookie > geo header > Accept-Language
- **Font loading**: Custom fonts defined in `lib/fonts.ts`, loaded in layout
- **Legacy concepts**: `lib/concepts.ts` contains old 5-concept system (not used anymore)

## Known Issues & TODOs

- [ ] Add comprehensive test suite
- [ ] Migrate away from deprecated `lib/supabase.ts`
- [ ] Add rate limiting to API routes
- [ ] Implement proper error tracking (Sentry?)
- [ ] Add analytics for funnel drop-off
- [ ] Optimize image generation costs

## Deployment

Deployed on Vercel with:
- Automatic deployments from `main` branch
- Environment variables configured in Vercel dashboard
- Supabase connection pooling via transaction mode
- Next.js image optimization enabled
