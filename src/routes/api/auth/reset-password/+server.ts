/**
 * Password Reset API Endpoint
 *
 * Validates the reset token and sets a new password for the user.
 * Uses custom tokens stored in Firestore instead of Firebase action codes.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase-admin';
import { validatePendingAction, deletePendingAction } from '$lib/server/pending-actions';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Extract token and new password from request body
		const { token, newPassword } = await request.json();

		if (!token || typeof token !== 'string') {
			return json({ error: 'Reset token is required' }, { status: 400 });
		}

		if (!newPassword || typeof newPassword !== 'string') {
			return json({ error: 'New password is required' }, { status: 400 });
		}

		// Validate password length
		if (newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		// Validate the token and get action data
		const { actionId, userId, data } = await validatePendingAction(token, 'passwordReset');

		// Type guard - ensure we have password reset data
		if (data.type !== 'passwordReset') {
			return json({ error: 'Invalid reset link' }, { status: 400 });
		}

		// Update Firebase Auth to set new password
		await adminAuth.updateUser(userId, {
			password: newPassword
		});

		// Delete the pending action (one-time use)
		await deletePendingAction(actionId);

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Password reset error:', error);

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
		if (firebaseError.code === 'auth/weak-password') {
			return json({ error: 'Password is too weak. Please choose a stronger password.' }, { status: 400 });
		}

		return json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
	}
};

