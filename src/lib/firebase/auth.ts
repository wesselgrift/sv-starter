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

		await sendEmailVerification(user);
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
		await sendEmailVerification(user);
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
			url: `${baseUrl}/set-new-password`,
			handleCodeInApp: true
		};

		await sendPasswordResetEmail(auth, email, actionCodeSettings);
		return { error: null };
	} catch (error: any) {
		return { error: error.message };
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

