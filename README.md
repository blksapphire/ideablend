# Idea Blend

Idea Blend is a platform for finding collaborators and building side projects together. Founders post an idea with the roles they need, builders apply with their skills, and once a team forms the project gets a private workspace with tasks, milestones, files and realtime chat.

## Features

- **Project discovery** - browse public projects, skill-matched recommendations ("Smart Match"), and a builder directory
- **Applications & roles** - apply to open roles, owner accepts or rejects, applicant confirms; filled slots tracked per role
- **Project workspace** - kanban-style tasks, milestones, file sharing, realtime messaging over Socket.IO
- **Public profiles** - skills, links, availability, completed-project count, response rate, and post-completion peer reviews
- **Social features** - follows, notifications, email + web-push delivery
- **Admin tools** - stats dashboard, user search, verify/ban/anonymize (no destructive SQL deletes)
- **AI assistant** - optional Claude-powered project assistant with read-only project tools (disabled unless `ANTHROPIC_API_KEY` is set)

## Architecture

| Layer | Tech | Free hosting |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS | Vercel |
| API | Node.js, Express, Prisma, Socket.IO | Render (free web service) |
| Database | PostgreSQL | Neon (free tier) |
| File storage | Local disk in dev, Supabase Storage in prod | Supabase (1 GB free) |

The API is a stateful long-running process (WebSockets + background integrations), so it runs on Render rather than as Vercel serverless functions. The frontend is a static SPA deployed to Vercel.

```
backend/    Express API, Prisma schema + migrations, Socket.IO, tests
frontend/   React SPA
render.yaml Free-tier blueprint for the API
```

## Local development

Prerequisites: Node.js 20+, PostgreSQL 14+.

```bash
# API
cd backend
cp .env.example .env          # set DATABASE_URL, DIRECT_URL and JWT_SECRET
npm install
npx prisma migrate deploy
npm run dev                   # http://localhost:4000

# Frontend (second terminal)
cd frontend
cp .env.example .env          # VITE_API_BASE=http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

Uploaded avatars and project files are written to `backend/uploads/` when Supabase is not configured.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled PostgreSQL connection string used by the app |
| `DIRECT_URL` | yes | Non-pooled connection used only by Prisma migrations |
| `JWT_SECRET` | yes | 32+ random characters in production |
| `FRONTEND_URL` | prod | Primary frontend origin (e.g. `https://ideablend.vercel.app`) |
| `CORS_ORIGINS` | no | Extra allowed origins, comma-separated |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | prod on ephemeral hosts | Durable upload storage |
| `SUPABASE_AVATAR_BUCKET`, `SUPABASE_FILE_BUCKET` | no | Bucket names, defaults `avatars` / `project-files` |
| `ANTHROPIC_API_KEY` | no | Enables the AI assistant |
| `GITHUB_TOKEN` | no | Raises GitHub API rate limit for repo lookups |
| `SMTP_*` | no | Outbound email (notifications, password reset) |
| `VAPID_*` | no | Web push notifications |
| `TRUST_PROXY` | no | Proxy hops in front of the app, default `1` |

`VITE_API_BASE` (frontend) must include the `/api` suffix.

## Deploying on a free stack

1. **Database - Neon**: create a project and set two connection strings: the **pooled** one goes in `DATABASE_URL` (append `?sslmode=require` if it is not already present), and the **direct** one goes in `DIRECT_URL` for migrations. Migrations run automatically on every deploy via `npm start`. Render's free tier has no outbound IPv6, so both hosts must be IPv4-reachable (the Neon pooler and direct hosts are; a Supabase direct connection is not, use the Supavisor pooler there instead).
2. **File storage - Supabase**: create a project, then create two Storage buckets:
   - `avatars` - **public** (profile pictures are public by design)
   - `project-files` - **private** (downloads are proxied through authenticated API routes)

   Copy the project URL and the `service_role` key into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
3. **API - Render**: create a new **Blueprint** from this repo. `render.yaml` defines the free web service, health check (`/api/health`), and prompts for the secrets it cannot generate (`DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, Supabase keys). Leave `FRONTEND_URL` blank until Vercel is deployed, then set it and redeploy.
4. **Frontend - Vercel**: import the repo, set the **root directory** to `frontend` (framework: Vite), and add `VITE_API_BASE=https://<your-service>.onrender.com/api`. `frontend/vercel.json` handles SPA route rewrites.
5. Redeploy the API with `FRONTEND_URL` set to the Vercel production URL so CORS and email links resolve correctly.

Free-tier notes: Render instances spin down after inactivity, so the first request after a quiet period can take 30–60s. Uploaded files must use Supabase Storage because the Render filesystem resets on deploy/restart. The app logs a warning at boot if production is running on local-disk storage.

## Tests

```bash
cd backend
npm test                      # unit + module-loading tests
npx prisma validate

npm run build                 # frontend production build (from frontend/)
```

For an end-to-end API check, start the API against a throwaway database and run the smoke script:

```bash
DATABASE_URL=postgresql://.../ideablend_test NODE_ENV=test JWT_SECRET=smoke-test-secret-at-least-32-chars-long PORT=4100 node src/index.js
SMOKE_BASE=http://127.0.0.1:4100/api node scripts/smoke.mjs
```

The smoke script exercises registration, auth normalization, project creation, applications/accept/confirm, workspace privacy, assistant fallback, password reset single-use behavior, URL validation, rate-limit headers and CORS.

## Security notes

- Helmet headers, CORS allowlist (shared by HTTP and Socket.IO), rate limiting on API and auth routes
- JWT auth, bcrypt password hashing, single-use expiring reset tokens
- Ownership/membership checks on every project, task, file, message and agent route
- Upload MIME allowlist for avatars; random server-side filenames; `http(s)`-only URL validation
- Private projects return 404 to non-members; no user hard-deletes (anonymization preserves other users' history)
- Web-push endpoints restricted to known push services (SSRF guard); HTML-escaped email bodies
