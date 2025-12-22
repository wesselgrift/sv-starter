/**
 * Send Email Change Verification API Endpoint
 *
 * Creates a pending action with a custom token and sends a verification
 * email to the new email address via Loops. Uses custom tokens instead
 * of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendEmailChangeVerificationEmail } from '$lib/server/loops';
import { createPendingAction } from '$lib/server/pending-actions';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	// Use APP_URL from env if set, otherwise auto-detect from request
	const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;

	try {
		const { currentEmail, newEmail } = await request.json();

		if (!currentEmail || !newEmail) {
			return json({ error: 'Current email and new email are required' }, { status: 400 });
		}

		// Basic email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Verify the user is authenticated via session cookie
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Verify session and get user info
		const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

		// Ensure the current email matches the authenticated user
		if (decodedClaims.email !== currentEmail) {
			return json({ error: 'Email mismatch' }, { status: 403 });
		}

		// Check if the new email is already in use
		try {
			await adminAuth.getUserByEmail(newEmail);
			// If we get here, the email already exists
			return json({ error: 'This email is already in use by another account' }, { status: 400 });
		} catch (err: unknown) {
			// User not found is expected - means email is available
			const firebaseError = err as { code?: string };
			if (firebaseError.code !== 'auth/user-not-found') {
				throw err; // Re-throw unexpected errors
			}
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
			type: 'emailChange',
			oldEmail: currentEmail,
			newEmail
		});

		// Build verification link with custom token
		const verificationLink = `${baseUrl}/verify-email-change?token=${token}`;

		// Send verification email to the NEW email address via Loops
		const result = await sendEmailChangeVerificationEmail(
			newEmail,
			firstName,
			verificationLink,
			newEmail,
			baseUrl
		);

		if (!result.success) {
			return json(
				{ error: result.error || 'Failed to send email change verification' },
				{ status: 500 }
			);
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Send email change verification error:', error);

		// Handle specific Firebase errors
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/email-already-exists') {
			return json({ error: 'This email is already in use by another account' }, { status: 400 });
		}
		if (firebaseError.code === 'auth/invalid-email') {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}
		if (firebaseError.code === 'auth/session-cookie-expired') {
			return json({ error: 'Session expired' }, { status: 401 });
		}

		return json(
			{ error: firebaseError.message || 'Failed to send email change verification' },
			{ status: 500 }
		);
	}
};
