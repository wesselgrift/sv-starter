/**
 * Send Verification Email API Endpoint
 *
 * Creates a pending action with a custom token and sends a verification
 * email via Loops. Uses custom tokens instead of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendVerificationEmail } from '$lib/server/loops';
import { createPendingAction } from '$lib/server/pending-actions';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	// Use APP_URL from env if set, otherwise auto-detect from request
	const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;

	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Verify the user is authenticated via session cookie
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Verify session and get user info
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

		// Ensure the email matches the authenticated user
		if (decodedClaims.email !== email) {
			return json({ error: 'Email mismatch' }, { status: 403 });
		}

		// Get user's first name from Firestore for personalized email
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data:', err);
		}

		// Create pending action and get token
		const token = await createPendingAction(decodedClaims.uid, {
			type: 'emailVerification',
			email
		});

		// Build verification link with custom token
		const verificationLink = `${baseUrl}/verify-email?token=${token}`;

		// Send verification email via Loops
		const result = await sendVerificationEmail(email, firstName, verificationLink, baseUrl);

		if (!result.success) {
			return json({ error: result.error || 'Failed to send verification email' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Send verification error:', error);

		// Handle specific Firebase errors
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/user-not-found') {
			return json({ error: 'User not found' }, { status: 404 });
		}
		if (firebaseError.code === 'auth/session-cookie-expired') {
			return json({ error: 'Session expired' }, { status: 401 });
		}

		return json(
			{ error: firebaseError.message || 'Failed to send verification email' },
			{ status: 500 }
		);
	}
};
