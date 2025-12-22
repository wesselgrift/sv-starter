<script lang="ts">
	/**
	 * Email Change Verification Component
	 *
	 * Handles email change verification by calling the server endpoint with the token.
	 * Uses custom tokens stored in Firestore instead of Firebase action codes.
	 * The server also sends a notification email to the old email address.
	 */

	// UI component imports
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck, CircleAlert, LoaderCircle } from '@lucide/svelte';

	// SvelteKit imports
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Firebase imports for logout
	import { logout } from '$lib/firebase/auth';

	// Extract token from URL query parameters
	const token = $derived(page.url.searchParams.get('token'));

	// States
	let verified = $state(false);
	let error = $state('');
	let loading = $state(true);
	let tokenInvalid = $state(false);
	let redirecting = $state(false);

	// Check if token is missing from URL
	const invalidTokenFromUrl = $derived(!token);
	const invalidToken = $derived(invalidTokenFromUrl || tokenInvalid);

	// Verify email change on mount
	$effect(() => {
		if (!token || verified || error) return;
		verifyEmailChange();
	});

	async function verifyEmailChange() {
		if (!token) {
			error = 'Invalid or missing verification link. Please request a new email change.';
			loading = false;
			tokenInvalid = true;
			return;
		}

		loading = true;
		error = '';

		try {
			// Call server endpoint to verify and change email
			const response = await fetch('/api/auth/verify-email-change', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to change email');
			}

			verified = true;

			// Email has been changed - user needs to sign in again with new email
			// Sign them out and redirect to login after 3 seconds
			setTimeout(() => {
				redirecting = true;
				logout('/login');
			}, 3000);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to change email';

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
		logout('/login');
	}
</script>

{#if invalidToken}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email change failed</AlertTitle>
		<AlertDescription
			>{error ||
				'Invalid or missing verification link. Please request a new email change.'}</AlertDescription
		>
	</Alert>
	<Button onclick={() => goto('/login')}> Go to login </Button>
{:else if verified}
	<Alert>
		<CircleCheck />
		<AlertTitle>Email changed successfully</AlertTitle>
		<AlertDescription>
			Your email has been updated. Please sign in with your new email address.
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
		<AlertTitle>Verifying your email change</AlertTitle>
		<AlertDescription> This may take a few seconds. </AlertDescription>
	</Alert>
{:else if error}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email change failed</AlertTitle>
		<AlertDescription>{error}</AlertDescription>
	</Alert>
	<Button onclick={() => goto('/login')}> Go to login </Button>
{/if}
