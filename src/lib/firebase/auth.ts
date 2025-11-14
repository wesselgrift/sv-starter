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

const googleProvider = new GoogleAuthProvider();

export async function register(email: string, password: string, firstName?: string, lastName?: string) {
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		// Send verification email
		await sendEmailVerification(user);

		// Exchange ID token for session cookie
		await ensureServerSession(user);

		return { user, error: null };
	} catch (error: any) {
		return { user: null, error: error.message };
	}
}

export async function login(email: string, password: string) {
	try {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		const user = userCredential.user;

		// Exchange ID token for session cookie
		await ensureServerSession(user);

		// Persist email to localStorage
		if (typeof window !== 'undefined') {
			localStorage.setItem('lastEmail', email);
		}

		// Redirect based on email verification status
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

export async function loginWithGoogle() {
	try {
		const userCredential = await signInWithPopup(auth, googleProvider);
		const user = userCredential.user;

		// Exchange ID token for session cookie
		await ensureServerSession(user);

		// Google accounts are automatically verified
		goto('/app');

		return { user, error: null };
	} catch (error: any) {
		return { user: null, error: error.message };
	}
}

export async function logout(redirectTo: string = '/login') {
	try {
		await signOut(auth);

		// Clear session cookie
		await fetch('/api/auth/logout', { method: 'POST' });

		// Clear userProfile store
		userProfile.set(null);

		// Clear localStorage
		if (typeof window !== 'undefined') {
			localStorage.removeItem('lastEmail');
		}

		goto(redirectTo);
	} catch (error: any) {
		console.error('Logout error:', error);
	}
}

export async function ensureServerSession(user: User, forceRefresh = false) {
	try {
		// Force token refresh if needed (e.g., after email verification to get updated claims)
		const idToken = await user.getIdToken(forceRefresh);

		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ idToken })
		});

		if (!response.ok) {
			throw new Error('Failed to create server session');
		}

		// Invalidate all to refresh server-side data
		await invalidateAll();
	} catch (error) {
		console.error('Failed to ensure server session:', error);
		throw error;
	}
}

export async function sendVerificationEmail(user: User) {
	try {
		await sendEmailVerification(user);
		return { error: null };
	} catch (error: any) {
		return { error: error.message };
	}
}

export async function resetPassword(email: string) {
	try {
		await sendPasswordResetEmail(auth, email);
		return { error: null };
	} catch (error: any) {
		return { error: error.message };
	}
}

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

