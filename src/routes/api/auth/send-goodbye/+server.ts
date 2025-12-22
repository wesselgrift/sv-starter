/**
 * Send Goodbye Email API Endpoint
 *
 * Sends a goodbye/account deleted confirmation email to the user.
 * Called before account deletion to ensure the email is sent
 * while we still have access to the user's data.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { sendAccountDeletedEmail } from '$lib/server/loops';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		// Get session cookie
		const sessionCookie = cookies.get('session');
		if (!sessionCookie) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Verify the session cookie and extract user ID
		const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
		const uid = decodedToken.uid;

		// Get user data for the email
		const userRecord = await adminAuth.getUser(uid);
		let firstName = 'there';
		try {
			const userDoc = await adminDb.collection('users').doc(uid).get();
			if (userDoc.exists) {
				firstName = userDoc.data()?.firstName || 'there';
			}
		} catch (err) {
			console.error('Error fetching user data for goodbye email:', err);
		}

		// Send goodbye email
		if (userRecord.email) {
			const result = await sendAccountDeletedEmail(userRecord.email, firstName);
			if (!result.success) {
				console.error('Failed to send goodbye email:', result.error);
				// Don't fail the request - allow deletion to proceed
			}
		}

		return json({ success: true });
	} catch (error: unknown) {
		console.error('Send goodbye email error:', error);

		// Handle session errors
		const firebaseError = error as { code?: string; message?: string };
		if (firebaseError.code === 'auth/session-cookie-expired') {
			return json({ error: 'Session expired' }, { status: 401 });
		}

		return json({ error: firebaseError.message || 'Failed to send goodbye email' }, { status: 500 });
	}
};

