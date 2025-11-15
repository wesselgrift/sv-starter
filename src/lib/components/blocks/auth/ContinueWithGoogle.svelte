<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { loginWithGoogle } from '$lib/firebase/auth';

	let loading = $state(false);
	let error = $state('');

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
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-2">
	<Button
		type="button"
		variant="outline"
		class="w-full"
		onclick={handleGoogleLogin}
		disabled={loading}
	>
        <img src="/google-icon.svg" alt="Google" class="w-5 h-5" />
		{loading ? 'Signing in...' : 'Continue with Google'}
	</Button>

	{#if error}
		<div class="text-sm text-destructive">{error}</div>
	{/if}
</div>

