// Firebase auth functions and types
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	sendEmailVerification,
	sendPasswordResetEmail,
	onAuthStateChanged,
	linkWithPopup,
	unlink,
	deleteUser,
	type User
} from 'firebase/auth';
import { auth } from './firebase';
import { goto } from '$app/navigation';
import { invalidateAll } from '$app/navigation';
import { userProfile } from '$lib/stores/userStore';

// Google authentication provider instance
const googleProvider = new GoogleAuthProvider();

// Creates a new user account with email/password and sends verification email
export async function register(email: string, password: string, firstName?: string, lastName?: string) {
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		// Get the base URL for the custom action handler
		const baseUrl =
			typeof window !== 'undefined'
				? window.location.origin
				: import.meta.env.VITE_APP_URL || 'http://localhost:5173';
		
		const actionCodeSettings = {
			url: `${baseUrl}/auth-action`,
			handleCodeInApp: true
		};

		await sendEmailVerification(user, actionCodeSettings);
		await ensureServerSession(user, false, firstName, lastName);

		return { user, error: null };
	} catch (error: any) {
		return { user: null, error: error.message };
	}
}

// Signs in user with email/password and redirects based on verification status
export async function login(email: string, password: string) {
	try {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		await ensureServerSession(user);

		if (typeof window !== 'undefined') {
			localStorage.setItem('lastEmail', email);
		}

		if (user.emailVerified) {
			goto('/app');
		} else {
			goto('/verify-email');
		}

		return { user, error: null };
	} catch (error: any) {
		return { user: null, error: error.message };
	}
}

// Signs in user with Google OAuth popup
export async function loginWithGoogle() {
	try {
		const userCredential = await signInWithPopup(auth, googleProvider);
		const user = userCredential.user;

		await ensureServerSession(user);
		goto('/app');

		return { user, error: null };
	} catch (error: any) {
		return { user: null, error: error.message };
	}
}

// Signs out user, clears session and local data, then redirects
export async function logout(redirectTo: string = '/login') {
	try {
		await signOut(auth);
		await fetch('/api/auth/logout', { method: 'POST' });
		userProfile.set(null);

		if (typeof window !== 'undefined') {
			localStorage.removeItem('lastEmail');
		}

		goto(redirectTo);
	} catch (error: any) {
		console.error('Logout error:', error);
	}
}

// Exchanges Firebase ID token for server session cookie and refreshes server-side data
export async function ensureServerSession(user: User, forceRefresh = false, firstName?: string, lastName?: string) {
	try {
		const idToken = await user.getIdToken(forceRefresh);

		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken, firstName, lastName })
		});

		if (!response.ok) {
			throw new Error('Failed to create server session');
		}

		await invalidateAll();
	} catch (error) {
		console.error('Failed to ensure server session:', error);
		throw error;
	}
}

// Sends email verification to the user
export async function sendVerificationEmail(user: User) {
	try {
		// Get the base URL for the custom action handler
		const baseUrl =
			typeof window !== 'undefined'
				? window.location.origin
				: import.meta.env.VITE_APP_URL || 'http://localhost:5173';
		
		const actionCodeSettings = {
			url: `${baseUrl}/auth-action`,
			handleCodeInApp: true
		};

		await sendEmailVerification(user, actionCodeSettings);
		return { error: null };
	} catch (error: any) {
		return { error: error.message };
	}
}

// Sends password reset email to the provided email address
export async function resetPassword(email: string) {
	try {
		// Get the base URL for the custom action handler
		const baseUrl =
			typeof window !== 'undefined'
				? window.location.origin
				: import.meta.env.VITE_APP_URL || 'http://localhost:5173';
		
		const actionCodeSettings = {
			url: `${baseUrl}/auth-action`,
			handleCodeInApp: true
		};

		await sendPasswordResetEmail(auth, email, actionCodeSettings);
		return { error: null };
	} catch (error: any) {
		return { error: error.message };
	}
}

// Links Google provider to the current user account
export async function linkGoogleProvider() {
	try {
		const user = auth.currentUser;
		if (!user) {
			return { error: 'No user signed in' };
		}

		const userCredential = await linkWithPopup(user, googleProvider);
		await ensureServerSession(userCredential.user, true);
		await invalidateAll();

		return { user: userCredential.user, error: null };
	} catch (error: any) {
		// Handle specific Firebase errors
		if (error.code === 'auth/provider-already-linked') {
			return { user: null, error: 'Google account is already linked to this account' };
		}
		if (error.code === 'auth/credential-already-in-use') {
			return { user: null, error: 'This Google account is already associated with another account' };
		}
		if (error.code === 'auth/requires-recent-login') {
			return { user: null, error: 'Please sign in again to link your Google account' };
		}
		return { user: null, error: error.message || 'Failed to link Google account' };
	}
}

// Unlinks Google provider from the current user account
export async function unlinkGoogleProvider() {
	try {
		const user = auth.currentUser;
		if (!user) {
			return { error: 'No user signed in' };
		}

		// Check if user has email/password provider before unlinking
		const hasEmailPassword = user.providerData.some((provider) => provider.providerId === 'password');
		if (!hasEmailPassword) {
			return { error: 'Cannot unlink Google. Please set a password first.' };
		}

		const unlinkedUser = await unlink(user, 'google.com');
		await ensureServerSession(unlinkedUser, true);
		await invalidateAll();

		return { user: unlinkedUser, error: null };
	} catch (error: any) {
		if (error.code === 'auth/no-such-provider') {
			return { user: null, error: 'Google account is not linked to this account' };
		}
		if (error.code === 'auth/requires-recent-login') {
			return { user: null, error: 'Please sign in again to unlink your Google account' };
		}
		return { user: null, error: error.message || 'Failed to unlink Google account' };
	}
}

// Deletes the current user account and redirects to account-deleted page
export async function deleteAccount() {
	try {
		const user = auth.currentUser;
		if (!user) {
			return { error: 'No user signed in' };
		}

		await deleteUser(user);
		await fetch('/api/auth/logout', { method: 'POST' });
		userProfile.set(null);

		if (typeof window !== 'undefined') {
			localStorage.removeItem('lastEmail');
		}

		goto('/account-deleted');
		return { error: null };
	} catch (error: any) {
		if (error.code === 'auth/requires-recent-login') {
			return { error: 'Please sign in again before deleting your account' };
		}
		return { error: error.message || 'Failed to delete account' };
	}
}

// Sets up Firebase auth state listener and returns unsubscribe function
export function initializeAuth(
	onUserChange: (user: User | null) => void,
	onLoadingChange: (loading: boolean) => void
) {
	onLoadingChange(true);

	const unsubscribe = onAuthStateChanged(auth, async (user) => {
		onUserChange(user);
		onLoadingChange(false);
	});

	return unsubscribe;
}

