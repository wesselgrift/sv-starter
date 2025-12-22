# SV Starter

An opinionated SvelteKit 2 + Svelte 5 starter with Firebase Authentication (JWT session cookies). Includes production-ready auth flows, shadcn-svelte UI, Tailwind CSS v4.

## Highlights

- Email/password + Google auth (signup, login, reset, verification, email change)
- Account management (update name, email, password, set password for Google users, disconnect Google, delete account)
- Transactional emails via [Loops](https://loops.so) (welcome, verification, password reset, notifications)
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
| Email | [Loops](https://loops.so) transactional emails (easily swappable) |
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
| `APP_NAME` | Your app name (used in email templates) |
| `APP_URL` | Production URL (leave empty for dev auto-detection) |
| `VITE_FIREBASE_API_KEY` | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `VITE_FIREBASE_APP_ID` | Web app App ID |
| `FIREBASE_PROJECT_ID` | Same as above (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Multi-line private key (`\n` preserved) |
| `LOOPS_API_KEY` | Loops API key for transactional emails |

Never commit `.env`. Use secrets in CI/CD.

## Firebase configuration

1. Create Firebase project and add Web App
2. Enable auth providers (*Build → Authentication*):
   - Email/Password
   - Google (authorize `http://localhost:5173` and production domains)
3. **Configure custom action URLs** (*Authentication → Templates*):
   - **Password reset**: Set custom action URL to `http://localhost:5173/auth-action` (or your production domain)
   - **Email verification**: Set custom action URL to `http://localhost:5173/auth-action` (or your production domain)
   - **Email change**: Set custom action URL to `http://localhost:5173/auth-action` (or your production domain)
   
   The `/auth-action` route automatically routes users to the appropriate page based on the action type.
   - **Note**: Without this configuration, action emails will redirect to Firebase's default handler page instead of your custom pages
4. Create Firestore database (*Native* mode). Stores `users/{uid}` with `{ uid, email, firstName, lastName, emailVerified, createdAt, updatedAt }`
5. Generate service account (*Project settings → Service accounts → Generate new private key*), copy to `.env`
6. **(Optional)** Harden Firestore rules:
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

## Email service (Loops)

Transactional emails are handled via [Loops](https://loops.so). All email logic is centralized in `src/lib/server/loops.ts`.

### Emails sent

| Email | Trigger |
| ----- | ------- |
| Email verification | User signs up with email/password |
| Welcome | User verifies their email |
| Password reset | User requests password reset |
| Password changed | User resets or changes password |
| Password set | Google user sets a password |
| Email change verification | User requests email change |
| Email changed notification | Email change is completed (sent to old email) |
| Account deleted | User deletes their account |

### Setup

1. Create a [Loops](https://loops.so) account
2. Create transactional email templates for each email type above
3. Copy the transactional IDs and update `TRANSACTIONAL_IDS` in `src/lib/server/loops.ts`
4. Add your Loops API key to `.env` as `LOOPS_API_KEY`

### Template variables

All templates receive these data variables:
- `appName` - Your app name (from `APP_NAME` env var)
- `firstName` - User's first name
- `baseUrl` - Your app's base URL

Additional variables per template:
- **Verification/Reset emails**: `verificationLink` or `resetLink`
- **Email change**: `newEmail`, `verificationLink`
- **Email changed notification**: `newEmail`, `recoveryLink`

### Switching email providers

The email service is designed to be easily swappable. All functions follow the same interface:

```typescript
Promise<{ success: boolean; error?: string }>
```

To switch to another provider (e.g., Resend, SendGrid, Postmark):

1. Replace the SDK import and client initialization in `src/lib/server/loops.ts`
2. Update the function implementations to use the new provider's API
3. Update template IDs or switch to inline HTML templates

No changes needed to the API endpoints—they just call the exported functions.

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
| `/set-new-password` | Set new password (from email link) |
| `/verify-email` | Email verification polling |
| `/verify-email-success` | Handle email verification from email link |
| `/verify-email-change` | Handle email change verification from email link |
| `/auth-action` | Firebase action handler (routes to appropriate pages) |
| `/app` | Protected area |
| `/app/account` | Account management (update profile, email, password, delete) |
| `/account-deleted` | Account deleted confirmation |
| `/api/auth/login` | Exchange ID token for session cookie + seed Firestore |
| `/api/auth/logout` | Clear session cookie |
| `/api/auth/set-password` | Set password for Google-authenticated users |
| `/api/auth/update-profile` | Update user profile (name) |
| `/api/auth/update-email` | Update user email address |
| `/api/auth/update-password` | Update user password |
| `/api/auth/send-verification` | Send email verification link |
| `/api/auth/verify-email` | Verify email from link |
| `/api/auth/send-password-reset` | Send password reset link |
| `/api/auth/reset-password` | Reset password from link |
| `/api/auth/send-email-change` | Send email change verification |
| `/api/auth/verify-email-change` | Verify email change from link |
| `/api/auth/recover-email` | Recover email (revert unauthorized change) |
| `/api/auth/send-goodbye` | Send account deleted confirmation email |

Routes protected in `src/hooks.server.ts`: verifies session cookie, stores claims on `event.locals.user`, redirects unverified/unauthenticated users.

### Auth flow

1. Forms call `src/lib/firebase/auth.ts` helpers
2. `ensureServerSession` POSTs Firebase ID token to `/api/auth/login` after Firebase auth
3. Server verifies ID token, creates JWT session cookie (5-day expiry), upserts Firestore profile
4. `src/hooks.server.ts` verifies JWT session cookie for SSR-aware auth
5. Protected layouts (`src/routes/app/+layout.server.ts`) fetch Firestore profile, expose via `userProfile` store

### UI & utilities

- **shadcn-svelte**: Preconfigured via `components.json`, add components with `npx shadcn-svelte@latest add <component>`
- **Theming**: CSS variables in `src/app.css`
- **Auth blocks**: `src/lib/components/blocks/auth` (signup, signin, password reset, email verification forms)
- **Profile blocks**: `src/lib/components/blocks/profile` (user profile management, account settings)
- **Stores**: `src/lib/stores/userStore.ts` (`userProfile` + `loading`)
- **Utils**: `bodyClassUpdater.ts` (body classes), `firebase-admin.ts` (Admin SDK init)
- **Email**: `src/lib/server/loops.ts` (transactional email functions)

## Extending

- Add pages under `src/routes/app/...` (auth context provided by `+layout`)
- Add shadcn-svelte components via CLI

## Deployment

Uses `@sveltejs/adapter-auto`. Choose adapter for your host (`adapter-node`, `adapter-vercel`, `adapter-cloudflare`, etc.). Configure Firebase secrets in hosting environment, ensure HTTPS-only cookies in production.
