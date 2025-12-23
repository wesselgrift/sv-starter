<script lang="ts">
	// UI components and Firebase auth function
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { loginWithGoogle } from '$lib/firebase/auth';

	// Component state for loading and error handling
	let loading = $state(false);
	let error = $state('');

	// Handles Google OAuth login flow with error handling
	async function handleGoogleLogin() {
		error = '';
		loading = true;

		try {
			const result = await loginWithGoogle();
			if (result.error) {
				error = result.error;
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		}
	}
</script>

<!-- Google sign-in button with loading state and error display -->
<div class="space-y-2">
	<Button
		type="button"
		variant="outline"
		class="w-full"
		onclick={handleGoogleLogin}
		disabled={loading}
	>
		{#if loading}
			<Spinner class="size-5" />
			Continue with Google
		{:else}
			<img src="/google-icon.svg" alt="Google" class="size-5" />
			Continue with Google
		{/if}
	</Button>

	{#if error}
		<div class="text-sm text-destructive">{error}</div>
	{/if}
</div>

