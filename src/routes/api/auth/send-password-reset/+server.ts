/**
 * Send Password Reset Email API Endpoint
 *
 * Creates a pending action with a custom token and sends a password reset
 * email via Loops. Uses custom tokens instead of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendPasswordResetEmail } from '$lib/server/loops';
import { createPendingAction } from '$lib/server/pending-actions';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, url }) => {
	// Use APP_URL from env if set, otherwise auto-detect from request
	const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;

	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Try to get user info for personalized email
		let firstName = 'there';
		let userId: string | null = null;

		try {
			const userRecord = await adminAuth.getUserByEmail(email);
			userId = userRecord.uid;

			const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err: unknown) {
			// If user doesn't exist, we still want to return success
			// to prevent email enumeration attacks
			const firebaseError = err as { code?: string };
			if (firebaseError.code === 'auth/user-not-found') {
				// Return success even though user doesn't exist (security best practice)
				return json({ success: true });
			}
			console.error('Error fetching user data:', err);
		}

		// If we couldn't get userId, user doesn't exist
		// Return success to prevent email enumeration
		if (!userId) {
			return json({ success: true });
		}

		// Create pending action and get token
		const token = await createPendingAction(userId, {
			type: 'passwordReset',
			email
		});

		// Build reset link with custom token
		const resetLink = `${baseUrl}/set-new-password?token=${token}`;

		// Send password reset email via Loops
		const result = await sendPasswordResetEmail(email, firstName, resetLink, baseUrl);

		if (!result.success) {
			// Still return success to prevent email enumeration
			console.error('Failed to send password reset email:', result.error);
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Send password reset error:', error);

		// Handle user not found - return success to prevent email enumeration
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/user-not-found') {
			return json({ success: true });
		}

		return json(
			{ error: firebaseError.message || 'Failed to send password reset email' },
			{ status: 500 }
		);
	}
};
