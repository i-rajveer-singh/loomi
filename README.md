# Loomi

Loomi is a warm, witty AI wellness and growth companion. It blends a coaching voice with empathetic reflection, then stores insights locally so users can revisit their growth arc.

## What it does

- Onboards users with a gentle intake flow to capture goals and context.
- Runs a real-time chat experience powered by Google Gemini via the AI SDK.
- Summarizes sessions into identity stakes, domain tags, and micro-goals.
- Visualizes saved context in the mind canvas.
- Stores all user context in local storage by design.

## Core flows

1. Landing page -> onboarding -> chat
2. End session -> summarize -> merge into local context
3. Mind canvas -> shows identity stakes, domains, and actionable goals

## Tech stack

- Next.js App Router (React 19)
- AI SDK + Gemini 2.5 Flash
- Tailwind CSS v4
- Framer Motion

## Project structure

- [app/page.tsx](app/page.tsx) landing page
- [app/onboarding/page.tsx](app/onboarding/page.tsx) onboarding wizard
- [app/chat/page.tsx](app/chat/page.tsx) chat UI and session flow
- [app/canvas/page.tsx](app/canvas/page.tsx) mind canvas view
- [app/api/chat/route.ts](app/api/chat/route.ts) chat streaming endpoint
- [app/api/summarize/route.ts](app/api/summarize/route.ts) session summarizer
- [app/components/NavBar.tsx](app/components/NavBar.tsx) top navigation
- [app/hooks/useTelemetry.ts](app/hooks/useTelemetry.ts) typing telemetry capture
- [app/utils/cognitiveState.ts](app/utils/cognitiveState.ts) receptivity heuristic

## Local data and privacy

Loomi stores user context in local storage under the key `loomi_context`. Nothing is persisted on a server. Use the "end session" action in the chat to run the summarizer and merge new insights into that local context, then check the mind canvas.

## Environment variables

Create [\.env.local](.env.local) with:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Do not commit secrets to Git. The default gitignore already excludes env files.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` start the dev server
- `npm run build` build for production
- `npm run start` run the production server
- `npm run lint` lint

## Contributing

- Keep the tone guidelines in [app/api/chat/route.ts](app/api/chat/route.ts) aligned with the product voice.
- Prefer small, testable UI changes in isolated components.
- If you add new context fields, update onboarding, chat payloads, and the mind canvas together.
