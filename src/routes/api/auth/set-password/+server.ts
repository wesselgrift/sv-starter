/**
 * Set Password API Endpoint
 *
 * Handles setting initial password for Google-only users.
 * Sends a notification email after successful password setup.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendPasswordSetNotification } from '$lib/server/loops';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	try {
		// Get session cookie
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Verify the session cookie and extract user ID
		// Use false for checkRevoked since setting password shouldn't revoke the session
		const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
		const uid = decodedToken.uid;

		// Get user record to check if password already exists
		const userRecord = await adminAuth.getUser(uid);
		const hasPasswordProvider = userRecord.providerData.some(
			(provider) => provider.providerId === 'password'
		);

		if (hasPasswordProvider) {
			return json(
				{ error: 'Password already set. Use update-password endpoint instead.' },
				{ status: 400 }
			);
		}

		// Extract new password from request body
		const { newPassword } = await request.json();

		if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		// Set password using Firebase Admin
		await adminAuth.updateUser(uid, {
			password: newPassword
		});

		// Get user data for notification email
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(uid).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data for notification:', err);
		}

		// Send password set notification (non-blocking)
		const baseUrl = env.APP_URL || `${url.protocol}//${url.host}`;
		if (userRecord.email) {
			sendPasswordSetNotification(userRecord.email, firstName, baseUrl).catch((err) => {
				console.error('Failed to send password set notification:', err);
			});
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Set password error:', error);

		// Handle specific Firebase errors
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/weak-password') {
			return json({ error: 'Password is too weak' }, { status: 400 });
		}
		if (firebaseError.code === 'auth/argument-error' || firebaseError.message?.includes('expired')) {
			return json({ error: 'Session expired. Please refresh the page and try again.' }, { status: 401 });
		}
		if (firebaseError.code === 'auth/session-cookie-expired') {
			return json({ error: 'Session expired. Please refresh the page and try again.' }, { status: 401 });
		}

		return json({ error: firebaseError.message || 'Failed to set password' }, { status: 500 });
	}
};
