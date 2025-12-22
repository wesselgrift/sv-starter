<script lang="ts">
	/**
	 * Email Verification Component
	 *
	 * Handles two scenarios:
	 * 1. No token - User just signed up, show "check your email" message
	 * 2. With token - Process the email verification
	 */

	// UI component imports
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { CircleCheck, CircleAlert, LoaderCircle, Mail } from '@lucide/svelte';

	// SvelteKit imports
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Firebase imports for session refresh
	import { auth } from '$lib/firebase/firebase';
	import { ensureServerSession } from '$lib/firebase/auth';

	// Extract token from URL query parameters
	const token = $derived(page.url.searchParams.get('token'));

	// If no token, user just signed up and needs to check email
	const awaitingVerification = $derived(!token);

	// States (only used when processing verification)
	let verified = $state(false);
	let error = $state('');
	let loading = $state(false);
	let tokenInvalid = $state(false);
	let redirecting = $state(false);

	// Combined invalid token check (only relevant when token exists)
	const invalidToken = $derived(token && tokenInvalid);

	// Verify email when token is present
	$effect(() => {
		if (!token || verified || error || loading) return;
		verifyEmail();
	});

	async function verifyEmail() {
		if (!token) return;

		loading = true;
		error = '';

		try {
			// Call server endpoint to verify email
			const response = await fetch('/api/auth/verify-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to verify email');
			}

			verified = true;

			// Refresh the current user's token to get updated emailVerified status
			const user = auth.currentUser;
			if (user) {
				await user.reload();
				await ensureServerSession(user, true);
				setTimeout(() => {
					redirecting = true;
					goto('/app');
				}, 3000);
			} else {
				setTimeout(() => {
					redirecting = true;
					goto('/login');
				}, 3000);
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';

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
		const user = auth.currentUser;
		goto(user ? '/app' : '/login');
	}

	async function resendVerification() {
		const user = auth.currentUser;
		if (!user?.email) return;

		loading = true;
		try {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: user.email })
			});

			if (response.ok) {
				// Show a brief success state
				error = '';
			}
		} catch (err) {
			console.error('Failed to resend verification:', err);
		} finally {
			loading = false;
		}
	}
</script>

{#if awaitingVerification}
	<!-- User just signed up - show "check your email" message -->
	<Alert>
		<Mail />
		<AlertTitle>Check your email</AlertTitle>
		<AlertDescription>
			We've sent you a verification link. Please check your inbox and click the link to verify your
			email address.
		</AlertDescription>
	</Alert>
	<Button onclick={resendVerification} variant="outline" class="w-full" disabled={loading}>
		{#if loading}
			<Spinner class="size-5" />
		{/if}
		Resend verification email
	</Button>
{:else if invalidToken}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email verification failed</AlertTitle>
		<AlertDescription
			>{error ||
				'Invalid or missing verification link. Please request a new verification email.'}</AlertDescription
		>
	</Alert>
{:else if verified}
	<Alert>
		<CircleCheck />
		<AlertTitle>Email verified successfully</AlertTitle>
		<AlertDescription>
			Your email has been verified. You will be redirected to the app in a moment.
		</AlertDescription>
	</Alert>
	<Button onclick={handleContinue} disabled={redirecting}>
		{#if redirecting}
			<Spinner class="size-5" />
			Redirecting...
		{:else}
			Go to app
		{/if}
	</Button>
{:else if loading}
	<Alert>
		<LoaderCircle class="animate-spin" />
		<AlertTitle>Verifying your email</AlertTitle>
		<AlertDescription> This may take a few seconds. </AlertDescription>
	</Alert>
{:else if error}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Email verification failed</AlertTitle>
		<AlertDescription>{error}</AlertDescription>
	</Alert>
{/if}
