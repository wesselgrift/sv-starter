/**
 * Email Recovery API Endpoint
 *
 * Allows users to revert an unwanted email change by restoring their old email.
 * This is a security feature - if someone's email was changed without permission,
 * they can use the recovery link sent to their old email to restore it.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { validatePendingAction, deletePendingAction } from '$lib/server/pending-actions';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Extract token from request body
		const { token } = await request.json();

		if (!token || typeof token !== 'string') {
			return json({ error: 'Recovery token is required' }, { status: 400 });
		}

		// Validate the token and get action data
		const { actionId, userId, data } = await validatePendingAction(token, 'recoverEmail');

		// Type guard - ensure we have email recovery data
		if (data.type !== 'recoverEmail') {
			return json({ error: 'Invalid recovery link' }, { status: 400 });
		}

		const { oldEmail, newEmail } = data;

		// Verify the user's current email matches what we expect
		// This ensures the recovery is for the right account state
		const userRecord = await adminAuth.getUser(userId);
		if (userRecord.email !== newEmail) {
			// Email has already been changed again - recovery link is no longer valid
			await deletePendingAction(actionId);
			return json(
				{ error: 'This recovery link is no longer valid. The email has been changed again.' },
				{ status: 400 }
			);
		}

		// Restore the old email using Admin SDK
		await adminAuth.updateUser(userId, {
			email: oldEmail
		});

		// Update Firestore user document
		const userRef = adminDb.collection('users').doc(userId);
		await userRef.update({
			email: oldEmail,
			updatedAt: new Date()
		});

		// Delete the pending action (one-time use)
		await deletePendingAction(actionId);

		return json({ success: true, restoredEmail: oldEmail });
	} catch (error: unknown) {
		console.error('Email recovery error:', error);

		// Handle known error messages from validatePendingAction
		if (error instanceof Error) {
			if (error.message.includes('Invalid') || error.message.includes('expired')) {
				return json({ error: error.message }, { status: 400 });
			}
		}

		// Handle Firebase-specific errors
		const firebaseError = error as { code?: string };
		if (firebaseError.code === 'auth/email-already-exists') {
			return json(
				{ error: 'Cannot restore email - it is now in use by another account' },
				{ status: 400 }
			);
		}
		if (firebaseError.code === 'auth/user-not-found') {
			return json({ error: 'Account not found' }, { status: 404 });
		}

		return json({ error: 'Failed to recover email. Please try again.' }, { status: 500 });
	}
};

