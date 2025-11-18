# SV Starter

An opinionated SvelteKit 2 + Svelte 5 starter for Firebase-authenticated apps. Includes production-ready auth flows, shadcn-svelte UI, Tailwind CSS v4, and server-side sessions synced with Firebase.

## Highlights

- Email/password + Google auth (signup, login, reset, verification)
- Secure session cookies via `/api/auth/login` & `/api/auth/logout`, protected routes in `src/hooks.server.ts`
- Firestore `users/{uid}` profiles hydrating `userProfile` store
- shadcn-svelte components in `lib/components/ui` (add more via CLI)
- Tailwind CSS v4 tokens in `src/app.css` with dark-mode defaults
- Linting, formatting, type-checking, and `svelte-package` tooling

## Tech stack

| Tool | Version / Notes |
| ---- | --------------- |
| SvelteKit | `@sveltejs/kit@^2.47.1`, Svelte 5 runes |
| Styling | Tailwind CSS v4, `tw-animate-css`, shadcn-svelte |
| Auth & Data | Firebase Web SDK (client) + Admin & Firestore (server) |
| State | Svelte stores (`src/lib/stores/userStore.ts`) |
| Tooling | Vite 7, TypeScript 5.9, ESLint 9, Prettier 3, `svelte-package` |

## Quick start

1. **Prerequisites**: Node.js 20+ and npm 10+
2. **Clone & install**:
   ```sh
   git clone <repo-url> sv-starter
   cd sv-starter
   npm install
   ```
3. **Setup environment**:
   ```sh
   cp env.example .env
   ```
4. **Configure Firebase** (see below) and fill `.env`
5. **Run**: `npm run dev -- --open`

## Environment variables

Client (`VITE_` prefix) and server secrets:

| Variable | Description |
| -------- | ----------- |
| `VITE_FIREBASE_API_KEY` | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `VITE_FIREBASE_APP_ID` | Web app App ID |
| `FIREBASE_PROJECT_ID` | Same as above (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Multi-line private key (`\n` preserved) |

Never commit `.env`. Use secrets in CI/CD.

## Firebase configuration

1. Create Firebase project and add Web App
2. Enable auth providers (*Build → Authentication*):
   - Email/Password
   - Google (authorize `http://localhost:5173` and production domains)
3. Create Firestore database (*Native* mode). Stores `users/{uid}` with `{ uid, email, firstName, lastName, emailVerified, createdAt, updatedAt }`
4. Generate service account (*Project settings → Service accounts → Generate new private key*), copy to `.env`
5. **(Optional)** Harden Firestore rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Start dev server (http://localhost:5173) |
| `npm run build` | Build app + package `src/lib` |
| `npm run preview` | Preview production build |
| `npm run check` / `check:watch` | Type-check with `svelte-check` |
| `npm run lint` | Run Prettier + ESLint |
| `npm run format` | Format with Prettier |
| `npm run prepack` | Package components (`svelte-package` + `publint`) |

Export modules from `src/lib/index.ts` before `prepack` if publishing.

## Architecture

### Routes

| Path | Purpose |
| ---- | ------- |
| `/` | Marketing splash |
| `/account` | Sign-up (email/password + Google) |
| `/login` | Login (email/password + Google + reset) |
| `/reset-password` | Request password reset |
| `/verify-email` | Email verification polling |
| `/app` | Protected area (shows `userProfile`, sign-out) |
| `/api/auth/login` | Exchange ID token for session cookie + seed Firestore |
| `/api/auth/logout` | Clear session cookie |

Routes protected in `src/hooks.server.ts`: verifies session cookie, stores claims on `event.locals.user`, redirects unverified/unauthenticated users.

### Auth flow

1. Forms call `src/lib/firebase/auth.ts` helpers
2. `ensureServerSession` POSTs to `/api/auth/login` after Firebase auth
3. Server verifies ID token, sets 5-day `session` cookie, upserts Firestore profile
4. `src/hooks.server.ts` reads cookie for SSR-aware auth
5. Protected layouts (`src/routes/app/+layout.server.ts`) fetch Firestore profile, expose via `userProfile` store

### UI & utilities

- **shadcn-svelte**: Preconfigured via `components.json`, add components with `npx shadcn-svelte@latest add <component>`
- **Theming**: CSS variables in `src/app.css`
- **Auth blocks**: `src/lib/components/blocks/auth` (forms, validation, loading states)
- **Stores**: `src/lib/stores/userStore.ts` (`userProfile` + `loading`)
- **Utils**: `bodyClassUpdater.ts` (body classes), `firebase-admin.ts` (Admin SDK init)

## Extending

- Add pages under `src/routes/app/...` (auth context provided by `+layout`)
- Add shadcn-svelte components via CLI

## Deployment

Uses `@sveltejs/adapter-auto`. Choose adapter for your host (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`, etc.). Configure Firebase secrets in hosting environment, ensure HTTPS-only cookies in production.
