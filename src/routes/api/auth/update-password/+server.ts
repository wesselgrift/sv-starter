// SvelteKit utilities and Firebase admin SDK
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase-admin';

// Handles POST requests for updating user password
export const POST: RequestHandler = async ({ request, cookies }) => {
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

		return json({ success: true });
	} catch (error: any) {
		console.error('Update password error:', error);
		
		// Handle specific Firebase errors
		if (error.code === 'auth/weak-password') {
			return json({ error: 'Password is too weak' }, { status: 400 });
		}

		return json({ error: error.message || 'Failed to update password' }, { status: 500 });
	}
};
