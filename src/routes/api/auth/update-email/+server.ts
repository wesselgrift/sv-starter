// SvelteKit utilities and Firebase admin SDK
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';

// Handles POST requests for updating user email
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

		// Extract new email from request body
		const { newEmail } = await request.json();

		if (!newEmail || typeof newEmail !== 'string' || !newEmail.trim()) {
			return json({ error: 'Valid email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail.trim())) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Get current user data to preserve emailVerified status
		const userRecord = await adminAuth.getUser(uid);
		const userRef = adminDb.collection('users').doc(uid);
		const userDoc = await userRef.get();
		
		// Determine current verification status (prefer Firestore, fallback to Auth)
		const currentEmailVerified = userDoc.exists 
			? (userDoc.data()?.emailVerified ?? false)
			: (userRecord.emailVerified ?? false);
		
		// Update email using Firebase Admin
		// Preserve verification status: if user was verified, keep them verified
		await adminAuth.updateUser(uid, {
			email: newEmail.trim(),
			emailVerified: currentEmailVerified // Preserve verification status
		});

		// Update Firestore user document - preserve current emailVerified status
		await userRef.update({
			email: newEmail.trim(),
			emailVerified: currentEmailVerified, // Keep current verification status
			updatedAt: new Date()
		});

		return json({ success: true });
	} catch (error: any) {
		console.error('Update email error:', error);
		
		// Handle specific Firebase errors
		if (error.code === 'auth/email-already-exists') {
			return json({ error: 'This email is already in use' }, { status: 400 });
		}
		if (error.code === 'auth/invalid-email') {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		return json({ error: error.message || 'Failed to update email' }, { status: 500 });
	}
};
