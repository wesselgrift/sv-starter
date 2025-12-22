/**
 * Update Password API Endpoint
 *
 * Handles password updates for authenticated users.
 * Sends a notification email after successful password change.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendPasswordChangedNotification } from '$lib/server/loops';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// Get session cookie
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Verify the session cookie and extract user ID
		const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
		const uid = decodedToken.uid;

		// Extract new password from request body
		const { newPassword } = await request.json();

		if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		// Update password using Firebase Admin
		await adminAuth.updateUser(uid, {
			password: newPassword
		});

		// Get user data for notification email
		const userRecord = await adminAuth.getUser(uid);
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(uid).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data for notification:', err);
		}

		// Send password changed notification (non-blocking)
		const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
		if (userRecord.email) {
			sendPasswordChangedNotification(userRecord.email, firstName, baseUrl).catch((err) => {
				console.error('Failed to send password changed notification:', err);
			});
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Update password error:', error);

		// Handle specific Firebase errors
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/weak-password') {
			return json({ error: 'Password is too weak' }, { status: 400 });
		}

		return json({ error: firebaseError.message || 'Failed to update password' }, { status: 500 });
	}
};
