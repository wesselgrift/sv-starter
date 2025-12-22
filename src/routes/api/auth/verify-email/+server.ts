/**
 * Email Verification API Endpoint
 *
 * Validates the verification token and marks the user's email as verified.
 * Sends a welcome email after successful verification.
 * Uses custom tokens stored in Firestore instead of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { validatePendingAction, deletePendingAction } from '$lib/server/pending-actions';
import { sendWelcomeEmail } from '$lib/server/loops';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Extract token from request body
		const { token } = await request.json();

		if (!token || typeof token !== 'string') {
			return json({ error: 'Verification token is required' }, { status: 400 });
		}

		// Validate the token and get action data
		const { actionId, userId, data } = await validatePendingAction(token, 'emailVerification');

		// Type guard - ensure we have email verification data
		if (data.type !== 'emailVerification') {
			return json({ error: 'Invalid verification link' }, { status: 400 });
		}

		// Update Firebase Auth to mark email as verified
		await adminAuth.updateUser(userId, {
			emailVerified: true
		});

		// Update Firestore user document
		const userRef = adminDb.collection('users').doc(userId);
		await userRef.update({
			emailVerified: true,
			updatedAt: new Date()
		});

		// Delete the pending action (one-time use)
		await deletePendingAction(actionId);

		// Get user data for welcome email
		const userRecord = await adminAuth.getUser(userId);
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(userId).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data for welcome email:', err);
		}

		// Send welcome email (non-blocking)
		const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
		if (userRecord.email) {
			sendWelcomeEmail(userRecord.email, firstName, baseUrl).catch((err) => {
				console.error('Failed to send welcome email:', err);
			});
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Email verification error:', error);

		// Handle known error messages from validatePendingAction
		if (error instanceof Error) {
			if (error.message.includes('Invalid') || error.message.includes('expired')) {
				return json({ error: error.message }, { status: 400 });
			}
		}

		return json({ error: 'Failed to verify email. Please try again.' }, { status: 500 });
	}
};
