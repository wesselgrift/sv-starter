# SV Starter

An opinionated SvelteKit 2 + Svelte 5 starter for building Firebase-authenticated apps. It ships with production-ready auth flows, a shadcn-svelte UI kit, Tailwind CSS v4 tokens, and a server-side session that keeps SvelteKit locals in sync with Firebase.

## Highlights

- Full email/password + Google authentication with signup, login, password reset, and email verification screens.
- Secure Firebase session cookies managed via `/api/auth/login` & `/api/auth/logout`, wired into `src/hooks.server.ts` for route protection.
- Firestore-backed `users/{uid}` profiles that hydrate the `userProfile` store for use across `src/routes/app`.
- Styled with ShadCN-Svelte UI components, installed in `lib/components/ui`. Intall whatever you need from ShadCN-Svelte.
- Tailwind CSS v4 theme tokens and animation utilities defined in `src/app.css`, with a ready-to-brand palette and dark-mode defaults.
- Tooling for linting, formatting, type-checking, and packaging (`svelte-package`) should you choose to publish the components in `src/lib`.

## Tech stack

| Tool | Version / Notes |
| ---- | --------------- |
| SvelteKit | `@sveltejs/kit@^2.47.1`, Svelte 5 runes enabled out of the box |
| Styling | Tailwind CSS v4, `tw-animate-css`, shadcn-svelte tokens via `components.json` |
| Auth & Data | Firebase Web SDK (client) + Firebase Admin & Firestore (server) |
| State | Svelte stores (`src/lib/stores/userStore.ts`) for sharing auth/profile data |
| UI | shadcn-svelte components |
| Tooling | Vite 7, TypeScript 5.9, ESLint 9, Prettier 3, `svelte-package` + `publint` |

## Quick start

1. **Install prerequisites**  
   Use Node.js 20+ (SvelteKit supports ≥18.13; we test on 20/22) and npm 10+.

2. **Clone & install**

   ```sh
   git clone <repo-url> sv-starter
   cd sv-starter
   npm install
   ```

3. **Create your environment file**

   ```sh
   cp env.example .env
   ```

4. **Configure Firebase (details below) and fill in `.env`.**

5. **Run the dev server**

   ```sh
   npm run dev -- --open
   ```

6. **Build & preview**

   ```sh
   npm run build
   npm run preview
   ```

## Environment variables

`.env` combines client-side (prefixed with `VITE_`) and server-only secrets:

| Variable | Description |
| -------- | ----------- |
| `VITE_FIREBASE_API_KEY` | Web API key from Firebase project settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Typically `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional, used for future uploads |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `VITE_FIREBASE_APP_ID` | Web app App ID |
| `FIREBASE_PROJECT_ID` | Same as above, used by Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Multi-line private key string (`\n` preserved as shown in `env.example`) |

Never commit `.env`. For local dev you can keep the values inline; in CI/CD expose them as secrets.

## Firebase configuration checklist

1. **Create a Firebase project** and add a Web App.
2. **Enable authentication providers** under *Build → Authentication*:  
   - Email/Password  
   - Google (add `http://localhost:5173` and your production domains as authorized).
3. **Create a Firestore database** in *Native* mode. The starter reads/writes `users/{uid}` documents containing `{ uid, email, firstName, lastName, emailVerified, createdAt, updatedAt }`.
4. **Generate a service account** under *Project settings → Service accounts* and click “Generate new private key”. Copy the credentials into `.env`.
5. **(Optional) Harden Firestore rules** to allow users to read/write only their own profile. Example:  

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

## Available npm scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Start Vite dev server (defaults to http://localhost:5173) |
| `npm run build` | Build the SvelteKit app and run `npm run prepack` to package `src/lib` |
| `npm run preview` | Preview the production build |
| `npm run check` / `check:watch` | Type-check with `svelte-check` |
| `npm run lint` | Run Prettier (check) and ESLint |
| `npm run format` | Format with Prettier |
| `npm run prepack` | `svelte-package` + `publint` for distributing components from `src/lib` |

If you plan to publish the component library, export modules from `src/lib/index.ts` before running `prepack`.

## Application architecture

### Routes

| Path | Purpose |
| ---- | ------- |
| `/` | Marketing splash with CTA buttons |
| `/account` | Email/password sign-up form plus Google OAuth |
| `/login` | Email/password login plus Google OAuth and reset CTA |
| `/reset-password` | Request password reset email |
| `/verify-email` | Polling experience guiding the user to verify their address |
| `/app` | Protected area showing the hydrated `userProfile` and a sign-out CTA |
| `/api/auth/login` | Exchanges Firebase ID tokens for secure session cookies & seeds Firestore |
| `/api/auth/logout` | Clears the session cookie |

All non-public routes are protected in `src/hooks.server.ts`, which verifies the Firebase session cookie and either:

- Stores the decoded claims on `event.locals.user` for server-side loads, or
- Redirects to `/verify-email` (unverified) or `/login` (unauthenticated).

### Auth & data flow (high level)

1. Client forms call auth helpers in `src/lib/firebase/auth.ts`.
2. After Firebase returns a `User`, `ensureServerSession` POSTs to `/api/auth/login`.
3. The server verifies the ID token with `firebase-admin`, sets a 5-day `session` cookie, and upserts Firestore profile data.
4. `src/hooks.server.ts` reads the cookie on subsequent requests, ensuring SSR-aware auth and protecting routes.
5. Protected layouts (`src/routes/app/+layout.server.ts`) fetch the Firestore profile (`adminDb`) and expose it to the client via the `userProfile` store for display in `/app`.

### UI system

- [ShadCN for Svelte](https://www.shadcn-svelte.com/) as a flexible UI system
- `components.json` is preconfigured for shadcn-svelte CLI commands (aliases align with `$lib/components/ui`).
- Base tokens live in `src/app.css`. Update CSS variables there to rebrand.
- Ready-made auth blocks under `src/lib/components/blocks/auth` encapsulate form logic, validation states, and loading experiences.

### Utilities & stores

- `src/lib/stores/userStore.ts` exposes a `userProfile` writable store plus a `loading` flag leveraged by the root layout.
- `src/lib/utils/bodyClassUpdater.ts` adds/removes classes from `<body>` to style logged-in sections.
- `src/lib/server/firebase-admin.ts` centralizes Admin SDK initialization to avoid duplicate apps.

## Extending the starter

- **Add more pages** under `src/routes/app/...`; the `+layout` already provides auth context.
- **Add shadcn-svelte components** with `npx shadcn-svelte@latest add <component>` (respects `components.json` aliases).

## Deployment

The project currently uses `@sveltejs/adapter-auto`. Choose an adapter that matches your hosting target (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`, etc.) before deploying. Ensure `FIREBASE_PRIVATE_KEY` and the other secrets are configured in your hosting environment, and that cookies remain HTTPS-only in production.
