// SvelteKit utilities and Firebase admin SDK
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';

// Handles POST requests for updating user profile (firstName, lastName)
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

		// Extract firstName and lastName from request body
		const { firstName, lastName } = await request.json();

		// Validate inputs
		if (typeof firstName !== 'string' || typeof lastName !== 'string') {
			return json({ error: 'First name and last name are required' }, { status: 400 });
		}

		const trimmedFirstName = firstName.trim();
		const trimmedLastName = lastName.trim();

		if (!trimmedFirstName || !trimmedLastName) {
			return json({ error: 'First name and last name cannot be empty' }, { status: 400 });
		}

		// Update Firestore document
		const userRef = adminDb.collection('users').doc(uid);
		await userRef.update({
			firstName: trimmedFirstName,
			lastName: trimmedLastName,
			updatedAt: new Date()
		});

		return json({ success: true });
	} catch (error: any) {
		console.error('Update profile error:', error);
		return json({ error: error.message || 'Failed to update profile' }, { status: 500 });
	}
};
