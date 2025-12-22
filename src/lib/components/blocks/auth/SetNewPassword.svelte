<script lang="ts">
	/**
	 * Set New Password Component
	 *
	 * Handles password reset by calling the server endpoint with the token.
	 * Uses custom tokens stored in Firestore instead of Firebase action codes.
	 */

	// UI component imports
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { CircleCheck, CircleAlert } from '@lucide/svelte';

	// SvelteKit page state
	import { page } from '$app/state';

	// Extract token from URL query parameters
	const token = $derived(page.url.searchParams.get('token'));

	// Derived state for invalid token check (from URL parameters)
	const invalidTokenFromUrl = $derived(!token);
	const initialError = $derived(
		invalidTokenFromUrl ? 'Invalid or missing reset link. Please request a new password reset.' : ''
	);

	// States
	let passwordReset = $state(false);
	let error = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let tokenInvalid = $state(false);

	// Combined invalid token check
	const invalidToken = $derived(invalidTokenFromUrl || tokenInvalid);

	// Set initial error if token is invalid
	$effect(() => {
		if (initialError) {
			error = initialError;
		}
	});

	// Handle form submission
	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		// Validate passwords match
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		// Validate password length
		if (password.length < 6) {
			error = 'Password must be at least 6 characters long.';
			return;
		}

		// Validate token exists
		if (!token) {
			error = 'Invalid reset link. Please request a new password reset.';
			return;
		}

		loading = true;

		try {
			// Call server endpoint to reset password
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword: password })
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to reset password');
			}

			passwordReset = true;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';

			// Check for invalid/expired token errors
			if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
				tokenInvalid = true;
			}

			error = errorMessage;
		} finally {
			loading = false;
		}
	}
</script>

{#if error}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Password reset failed</AlertTitle>
		<AlertDescription>{error}</AlertDescription>
	</Alert>
{/if}

{#if invalidToken}
	<Button onclick={() => goto('/reset-password')} class="w-full"> Request new reset link </Button>
{:else if passwordReset}
	<Alert>
		<CircleCheck />
		<AlertTitle>Password reset successful</AlertTitle>
		<AlertDescription>You can now login with your new password.</AlertDescription>
	</Alert>
	<Button onclick={() => goto('/login')} class="w-full">Go to login</Button>
{:else}
	<form onsubmit={handleSubmit} class="space-y-5">
		<div class="space-y-2.5">
			<Label for="password">New Password</Label>
			<Input
				id="password"
				type="password"
				bind:value={password}
				required
				disabled={loading}
				minlength={6}
			/>
		</div>
		<div class="space-y-2.5">
			<Label for="confirmPassword">Confirm Password</Label>
			<Input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				required
				disabled={loading}
				minlength={6}
			/>
		</div>
		<Button type="submit" class="w-full" disabled={loading}>
			{#if loading}
				<Spinner class="size-5" />
				Setting new password
			{:else}
				Set new password
			{/if}
		</Button>
	</form>
{/if}
