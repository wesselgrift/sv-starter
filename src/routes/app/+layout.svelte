<script lang="ts">
	import { userProfile as userProfileStore } from '$lib/stores/userStore';
	import { addBodyClass, removeBodyClass } from '$lib/utils/bodyClassUpdater';
	import type { PageData } from './$types';

	let { data, children }: { data: PageData; children: import('svelte').Snippet } = $props();

	// Sync userProfile store with server data
	$effect(() => {
		userProfileStore.set(data.userProfile || null);
	});

	// Add logged-in class to body
	$effect(() => {
		addBodyClass('logged-in');
		return () => {
			removeBodyClass('logged-in');
		};
	});
</script>

{@render children()}


