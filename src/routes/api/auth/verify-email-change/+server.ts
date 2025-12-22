/**
 * Email Change Verification API Endpoint
 *
 * Validates the verification token, updates the user's email,
 * and sends a notification to the old email address.
 * Uses custom tokens stored in Firestore instead of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { validatePendingAction, deletePendingAction, createPendingAction } from '$lib/server/pending-actions';
import { sendEmailChangedNotification } from '$lib/server/loops';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		// Extract token from request body
		const { token } = await request.json();

		if (!token || typeof token !== 'string') {
			return json({ error: 'Verification token is required' }, { status: 400 });
		}

		// Validate the token and get action data
		const { actionId, userId, data } = await validatePendingAction(token, 'emailChange');

		// Type guard - ensure we have email change data
		if (data.type !== 'emailChange') {
			return json({ error: 'Invalid verification link' }, { status: 400 });
		}

		const { oldEmail, newEmail } = data;

		// Get user's first name for the notification email
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(userId).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data for notification:', err);
		}

		// Update Firebase Auth to change email
		// Note: Using Admin SDK does NOT trigger Firebase's automatic notification email
		await adminAuth.updateUser(userId, {
			email: newEmail
		});

		// Update Firestore user document
		const userRef = adminDb.collection('users').doc(userId);
		await userRef.update({
			email: newEmail,
			updatedAt: new Date()
		});

		// Delete the pending action (one-time use)
		await deletePendingAction(actionId);

		// Create a recovery token so the user can revert the email change if it was unauthorized
		// This token has a longer expiry (7 days) to give users time to notice unwanted changes
		const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
		const recoveryToken = await createPendingAction(userId, {
			type: 'recoverEmail',
			oldEmail, // The email to recover/restore to
			newEmail // The current (potentially unwanted) email
		});
		const recoveryLink = `${baseUrl}/recover-email?token=${recoveryToken}`;

		// Send notification to OLD email address via Loops
		// This replaces Firebase's automatic notification and includes the recovery link
		const notificationResult = await sendEmailChangedNotification(
			oldEmail,
			firstName,
			newEmail,
			recoveryLink,
			baseUrl
		);

		if (!notificationResult.success) {
			// Log the error but don't fail the request - email change was successful
			console.error('Failed to send email change notification:', notificationResult.error);
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Email change verification error:', error);

		// Handle known error messages from validatePendingAction
		if (error instanceof Error) {
			if (
				error.message.includes('Invalid') ||
				error.message.includes('expired')
			) {
				return json({ error: error.message }, { status: 400 });
			}
		}

		// Handle Firebase-specific errors
		const firebaseError = error as { code?: string };
		if (firebaseError.code === 'auth/email-already-exists') {
			return json({ error: 'This email is already in use by another account' }, { status: 400 });
		}
		if (firebaseError.code === 'auth/invalid-email') {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		return json({ error: 'Failed to change email. Please try again.' }, { status: 500 });
	}
};

