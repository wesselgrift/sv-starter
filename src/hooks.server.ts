// Firebase Admin SDK for verifying session cookies
import { adminAuth } from '$lib/server/firebase-admin';

// SvelteKit utilities for redirects and type definitions
import { redirect, isRedirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/account', '/reset-password', '/set-new-password'];

// Routes that should be accessible even when authenticated (special cases)
// Note: /set-new-password is handled separately with oobCode validation
const alwaysAccessibleRoutes: string[] = [];

// Server hook that runs on every request to handle authentication and route protection
export const handle: Handle = async ({ event, resolve }) => {
	// Skip authentication checks for API routes
	if (event.url.pathname.startsWith('/api')) {
		console.log('[AUTH] Skipping auth check for API route:', event.url.pathname);
		return resolve(event);
	}

	console.log('[AUTH] Checking auth state for route:', event.url.pathname);

	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		console.log('[AUTH] Session cookie found, verifying...');
		try {
			// Verify the session cookie and decode user claims
			const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
			
			console.log('[AUTH] Session cookie verified successfully:', {
				uid: decodedClaims.uid,
				email: decodedClaims.email,
				email_verified: decodedClaims.email_verified,
				auth_time: new Date(decodedClaims.auth_time * 1000).toISOString()
			});
			
			// Attach user data to event locals for use in load functions and pages
			event.locals.user = decodedClaims;

			// Special handling for /set-new-password: only allow authenticated users if they have a valid reset link
			if (event.url.pathname === '/set-new-password') {
				const oobCode = event.url.searchParams.get('oobCode');
				const mode = event.url.searchParams.get('mode');
				
				// If authenticated user visits without valid reset parameters, redirect them
				if (!oobCode || !mode || mode !== 'resetPassword') {
					console.log('[AUTH] Authenticated user accessing /set-new-password without valid reset link, redirecting to /app');
					throw redirect(302, '/app');
				}
				// If they have valid parameters, allow access (they might be authenticated but clicked a reset link)
				console.log('[AUTH] Allowing access to /set-new-password with valid reset parameters');
				return resolve(event);
			}

			// Redirect authenticated users away from /reset-password (they should use account settings)
			if (event.url.pathname === '/reset-password') {
				console.log('[AUTH] Authenticated user accessing /reset-password, redirecting to /app');
				throw redirect(302, '/app');
			}

			// Redirect verified users away from public routes to the app
			// Exception: allow access to alwaysAccessibleRoutes (e.g., password reset with valid token)
			if (decodedClaims.email_verified && 
			    publicRoutes.includes(event.url.pathname) && 
			    !alwaysAccessibleRoutes.includes(event.url.pathname)) {
				console.log('[AUTH] Email verified user on public route, redirecting to /app');
				throw redirect(302, '/app');
			}

			// Redirect unverified users to email verification page
			if (!decodedClaims.email_verified && event.url.pathname !== '/verify-email') {
				console.log('[AUTH] Email not verified, redirecting to /verify-email');
				throw redirect(302, '/verify-email');
			}

			console.log('[AUTH] User authenticated, allowing access to:', event.url.pathname);
		} catch (error) {
			// Re-throw redirect errors to allow SvelteKit to handle them
			if (isRedirect(error)) {
				throw error;
			}

			console.log('[AUTH] Session cookie verification failed:', error instanceof Error ? error.message : 'Unknown error');
			
			// Clear invalid session data
			event.locals.user = null;
			event.cookies.delete('session', { path: '/' });
			console.log('[AUTH] Invalid session cookie deleted');

			// Redirect to login if trying to access protected route with invalid session
			if (!publicRoutes.includes(event.url.pathname)) {
				console.log('[AUTH] Protected route accessed without valid session, redirecting to /login');
				throw redirect(302, '/login');
			}
		}
	} else {
		console.log('[AUTH] No session cookie found - user not authenticated');
		event.locals.user = null;

		// Redirect to login if accessing protected route without session
		if (!publicRoutes.includes(event.url.pathname)) {
			console.log('[AUTH] Protected route accessed without session, redirecting to /login');
			throw redirect(302, '/login');
		} else {
			console.log('[AUTH] Public route accessed, allowing access');
		}
	}

	return resolve(event);
};

