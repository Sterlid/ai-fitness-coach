# AI Fitness Coach

Web-first calorie and workout coaching built with Expo, React Native Web, TypeScript, and Supabase.

## What is ready

- Expo web application with a responsive React Native Web interface
- Email/password authentication foundation
- Supabase session persistence using browser storage
- Migration-driven nutrition, meal, workout, recommendation, measurement, and feedback schema
- Row Level Security for every user-owned table
- Private `meal-images` storage bucket with per-user folder policies
- CI type checking

## Local setup

Requirements: Node.js 20 or newer. Docker is required only for the local Supabase stack.

```bash
npm install
cp .env.example .env
npm run supabase:start
npm run supabase:reset
npm start
```

The app deliberately shows a setup screen until valid Supabase values are present in `.env`.

## Link a hosted Supabase project

Create an empty Supabase project, then run:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

In the Supabase dashboard, copy the project URL and publishable key into `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
# Optional. The app otherwise uses the current browser origin.
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://your-production-domain.example.com/
```

Restart Expo after changing environment variables.

For hosted deployments, set `EXPO_PUBLIC_AUTH_REDIRECT_URL` in Vercel's Production environment to the production URL. Leave it unset for Preview deployments so each Vercel preview uses its own URL. In Supabase **Authentication → URL Configuration**, set the Site URL to the production URL and add the preview and local URLs to the Redirect URLs allow-list. If you customized the confirmation email, use `{{ .ConfirmationURL }}` so Supabase preserves the redirect URL passed by the app.

## Security boundaries

- The publishable key is expected in the browser app; access is constrained by Row Level Security.
- Never add the service-role key, database password, or an AI-provider secret to an `EXPO_PUBLIC_` variable.
- Meal images are private and must be stored at `<auth-user-id>/<random-file-name>` inside `meal-images`.
- AI-provider requests will be added later through a server-side Supabase Edge Function.

## Useful commands

```bash
npm run typecheck
npm run supabase:start
npm run supabase:reset
npm run supabase:lint
npm run supabase:stop
```

## Documentation

- [Product requirements](docs/PRD.md)
- [Formatted Word PRD](docs/AI_Fitness_Coach_PRD_v0.1.docx)

Regenerate the Word document with:

```bash
python -m pip install -r scripts/requirements-docs.txt
python scripts/build_prd.py
```
