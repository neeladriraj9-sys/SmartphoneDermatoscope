# Bright Skin Guide

AI-powered skin health companion for early detection and monitoring. Upload photos of skin lesions, get instant AI analysis, track changes over time with a visual body map, and stay on top of your skin health with personalized reminders.

---

## Features

- **AI Skin Analysis** — Upload a photo and receive an instant assessment powered by GPT-4o Vision, with risk indicators and recommendations.
- **Body Map** — Visually track where on your body each scan was taken.
- **Scan History** — Review all past scans, compare changes over time, and spot emerging patterns.
- **Change Detection** — Side-by-side comparison highlights differences between scans of the same location.
- **Reminders** — Set personalized reminders for follow-up checks and routine self-exams.
- **Learn Hub** — Curated articles on skin health, early warning signs, and best practices.
- **Secure Auth** — Email-based authentication with password reset flow. All health data is private and user-scoped.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS, shadcn/ui |
| State & Data | TanStack Query (React Query) |
| Routing | React Router v6 |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | GPT-4o Vision via Supabase Edge Function |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js + npm)
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key (for the scan analysis edge function)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/bright-skin-guide.git
cd bright-skin-guide
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> These values are found in your Supabase project settings under **API**.

### 4. Set up the database

Run the migration files in `supabase/migrations/` against your Supabase project to create the required tables, RLS policies, and edge function.

### 5. Configure the Edge Function

The scan analysis runs in a Supabase Edge Function (`supabase/functions/scan-analyze/`). Deploy it and set your `OPENAI_API_KEY` as a secret in Supabase Edge Function secrets.

### 6. Start the dev server

```bash
bun dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
bright-skin-guide/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── components/ui/   # shadcn/ui components
│   ├── context/         # React context (Auth)
│   ├── integrations/      # Supabase client & types
│   ├── lib/             # Utilities & helpers
│   ├── pages/           # Route-level page components
│   └── App.tsx          # Root router & providers
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start the Vite development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run test` | Run Vitest tests |

---

## Disclaimer

This application is intended for **informational and educational purposes only**. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always seek the advice of a dermatologist or other qualified health provider with any questions you may have regarding a skin condition.

---

## License

[MIT](LICENSE)
