import { writable } from 'svelte/store';

export interface UserProfile {
	uid: string;
	email: string | null;
	firstName?: string;
	lastName?: string;
	emailVerified: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export const loading = writable<boolean>(true);
export const userProfile = writable<UserProfile | null>(null);

