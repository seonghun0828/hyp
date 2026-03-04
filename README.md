# HYP (Highlight Your Product)

AI-powered marketing content generator for makers and solo founders. Input your product URL and automatically generate promotional content with AI-generated images and marketing copy.

## Overview

HYP helps makers overcome the hesitation of creating marketing content by:

- Analyzing product URLs to extract key information
- Generating promotional images using AI
- Creating marketing copy based on proven SUCCESs principles (Simple, Unexpected, Concrete, Credible, Emotional, Story)
- Providing an intuitive editor for customization
- Exporting ready-to-post content

**Design Philosophy**: HYP is optimized for starting action, not perfection. It provides a draft-first, experiment-safe environment that reduces psychological friction and turns overthinking into movement.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI APIs**: OpenAI (text generation), Google Gemini (image generation)
- **State Management**: Zustand with IndexedDB persistence
- **Styling**: Tailwind CSS 4
- **i18n**: next-intl (Korean/English support)
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Supabase account
- OpenAI API key
- Google Gemini API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/hyp.git
cd hyp
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

4. Set up Supabase database:

- Run the SQL migrations in your Supabase dashboard
- Create a storage bucket named `user-uploads`
- Configure Row Level Security (RLS) policies

5. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server with Turbopack (localhost:3000)

# Build & Production
pnpm build                  # Production build
pnpm start                  # Start production server

# Type Checking
npx tsc --noEmit           # Manual type check

# Linting
pnpm lint                  # Run ESLint
```

## Project Structure

```
app/
  [locale]/           # Localized routes (en/ko)
    page.tsx          # URL input page
    summary/          # Product summary edit
    styles/           # Style selection (4 dimensions)
    upload/           # Image upload/generation
    editor/           # Content editor
    result/           # Final result page
  api/                # API routes
    summary/          # Product analysis
    generate-image/   # Image generation
    generate-success-texts/  # Marketing text generation
    credits/          # Credit management
    upload-image/     # Image upload
    save-content/     # Content persistence
lib/
  api/                # API client functions
  categories/         # Product category definitions
  prompts/            # AI prompt templates
  supabase/           # Supabase client configs
  store.ts            # Zustand state management
  styles.ts           # Style option definitions
  credits.ts          # Credit management
components/           # Reusable UI components
messages/             # i18n translation files
public/images/        # Static assets
docs/
  design/             # Design system tokens
  references/         # Documentation
```

## Key Features

### Multi-Step Funnel Flow

1. **URL Input** - User enters product URL
2. **Product Summary** - AI extracts product information (title, core value, target customer, competitive edge, benefits)
3. **Style Selection** - User selects 4 style dimensions:
   - Message Type (problem-solving, benefit, comparison, story)
   - Visual Style (photo-realistic, line-drawing, cartoon, illustration)
   - Model Composition (product-only, hands-only, person-only, scene)
   - Aspect Ratio (1:1, 4:5, 16:9)
4. **Image Generation** - AI generates promotional images or user uploads custom images
5. **Marketing Text** - AI generates 6 SUCCESs principle variations
6. **Editor** - User edits and customizes content
7. **Result** - Export final content as PNG

### State Management

- Uses Zustand with IndexedDB persistence
- Survives browser refreshes
- Stores entire funnel state including large image URLs

### Authentication & Credits

- Anonymous users: Automatic `anon_token` cookie
- Logged-in users: Supabase Auth (optional)
- Credit-based system:
  - Image generation: 10 credits
  - Text generation: 1 credit
  - Credits checked before operations

### Internationalization

- Supports Korean and English via next-intl
- Automatic locale detection via:
  1. Cookie preference
  2. Vercel geo header
  3. Accept-Language header
- All routes prefixed: `/en/*`, `/ko/*`

## Design System

HYP follows a strict design philosophy optimized for action over perfection:

- **Single Source of Truth**: All design tokens in `docs/design/token.ts`
- **Functional Colors**: Colors communicate state, not decoration
- **Calm UI**: Tool-like, non-judgmental interface
- **Draft-First**: Content should look editable, not final

See `docs/design/` and `.claude/rules/design-system.md` for full guidelines.

## API Routes

| Endpoint                             | Method | Purpose                                |
| ------------------------------------ | ------ | -------------------------------------- |
| `/api/summary`                       | POST   | Analyze product URL with OpenAI        |
| `/api/generate-image`                | POST   | Generate promotional image with Gemini |
| `/api/generate-success-texts`        | POST   | Generate 6 SUCCESs framework texts     |
| `/api/generate-success-texts-stream` | POST   | Streaming version of text generation   |
| `/api/save-content`                  | POST   | Save final generated content           |
| `/api/upload-image`                  | POST   | Upload user image to Supabase Storage  |
| `/api/credits`                       | GET    | Fetch user credit balance              |
| `/api/check-cache`                   | GET    | Check marketing text cache             |

## Database Schema

Key tables in Supabase:

- `product_summaries` - Product analysis results
- `generated_contents` - Generated images + text combinations
- `marketing_text_cache` - Cache for SUCCESs texts (1 hour TTL)
- `user_credits` - Credit balance per user
- `quick_feedback` - User feedback

All tables use Row Level Security (RLS) for data isolation.

## Documentation

- **CLAUDE.md** - Complete project documentation for AI development
- **.claude/rules/** - Development guidelines and patterns
- **docs/design/** - Design system and tokens
