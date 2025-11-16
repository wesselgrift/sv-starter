<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeAuth } from '$lib/firebase/auth';
	import { loading } from '$lib/stores/userStore';
	import type { User } from 'firebase/auth';

	let { children } = $props();

	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		// Initialize auth listener
		unsubscribe = initializeAuth(
			(user: User | null) => {
				// User state is handled by auth functions
			},
			(isLoading: boolean) => {
				loading.set(isLoading);
			}
		);

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});
</script>

{@render children()}
