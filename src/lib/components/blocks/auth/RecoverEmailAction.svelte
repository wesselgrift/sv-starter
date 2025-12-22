<script lang="ts">
	/**
	 * Email Recovery Component
	 *
	 * Handles email recovery by calling the server endpoint with the token.
	 * This allows users to revert an unwanted email change.
	 */

	// UI component imports
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck, CircleAlert, LoaderCircle } from '@lucide/svelte';

	// SvelteKit imports
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Extract token from URL query parameters
	const token = $derived(page.url.searchParams.get('token'));

	// States
	let recovered = $state(false);
	let restoredEmail = $state('');
	let error = $state('');
	let loading = $state(true);
	let tokenInvalid = $state(false);
	let redirecting = $state(false);

	// Check if token is missing from URL
	const invalidTokenFromUrl = $derived(!token);
	const invalidToken = $derived(invalidTokenFromUrl || tokenInvalid);

	// Recover email on mount
	$effect(() => {
		if (!token || recovered || error) return;
		recoverEmail();
	});

	async function recoverEmail() {
		if (!token) {
			error = 'Invalid or missing recovery link.';
			loading = false;
			tokenInvalid = true;
			return;
		}

		loading = true;
		error = '';

		try {
			// Call server endpoint to recover email
			const response = await fetch('/api/auth/recover-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to recover email');
			}

			recovered = true;
			restoredEmail = result.restoredEmail || '';

			// Redirect to login after 3 seconds so user can sign in with restored email
			setTimeout(() => {
				redirecting = true;
				goto('/login');
			}, 3000);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to recover email';

			// Check for invalid/expired token errors
			if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
				tokenInvalid = true;
			}

			error = errorMessage;
		} finally {
			loading = false;
		}
	}

	function handleContinue() {
		redirecting = true;
		goto('/login');
	}
</script>

{#if invalidToken}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email recovery failed</AlertTitle>
		<AlertDescription
			>{error || 'Invalid or missing recovery link. This link may have expired.'}</AlertDescription
		>
	</Alert>
	<Button onclick={() => goto('/login')}> Go to login </Button>
{:else if recovered}
	<Alert>
		<CircleCheck />
		<AlertTitle>Email restored successfully</AlertTitle>
		<AlertDescription>
			Your email has been restored{restoredEmail ? ` to ${restoredEmail}` : ''}. Please sign in
			with your restored email address.
		</AlertDescription>
	</Alert>
	<Button onclick={handleContinue} disabled={redirecting}>
		{#if redirecting}
			<Spinner class="size-5" />
			Redirecting to login...
		{:else}
			Go to login
		{/if}
	</Button>
{:else if loading}
	<Alert>
		<LoaderCircle class="animate-spin" />
		<AlertTitle>Recovering your email</AlertTitle>
		<AlertDescription> This may take a few seconds. </AlertDescription>
	</Alert>
{:else if error}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email recovery failed</AlertTitle>
		<AlertDescription>{error}</AlertDescription>
	</Alert>
	<Button onclick={() => goto('/login')}> Go to login </Button>
{/if}

