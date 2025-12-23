// User profile type definition for authentication and personal data
export interface UserProfile {
	uid: string;
	email: string | null;
	emailVerified: boolean;
	firstName?: string;
	lastName?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Global reactive state using Svelte 5 runes
// Contains user authentication loading state and profile data
export const userState = $state<{
	loading: boolean;
	profile: UserProfile | null;
}>({
	loading: true,
	profile: null
});