<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { auth } from '$lib/firebase/firebase';
	import { sendVerificationEmail, ensureServerSession, logout } from '$lib/firebase/auth';
	import { goto } from '$app/navigation';
	import { onAuthStateChanged, type User } from 'firebase/auth';

	// State
	let user = $state<User | null>(null);
	let loading = $state(true);
	let sending = $state(false);
	let error = $state('');

	// Initialize auth state listener
	onMount(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			user = currentUser;
			loading = false;

			if (currentUser?.emailVerified) {
				handleVerified();
			}
		});

		return unsubscribe;
	});

	// Poll for email verification status every 4 seconds
	$effect(() => {
		if (!user || user.emailVerified) return;

		const interval = setInterval(async () => {
			await user?.reload();
			if (user?.emailVerified) {
				clearInterval(interval);
				handleVerified();
			}
		}, 4000);

		return () => clearInterval(interval);
	});

	// Handlers
	async function handleVerified() {
		if (user) {
			// Force token refresh to get updated email_verified status
			await ensureServerSession(user, true);
			goto('/app');
		}
	}

	async function handleResend() {
		if (!user) return;

		sending = true;
		error = '';

		try {
			const result = await sendVerificationEmail(user);
			if (result.error) {
				error = result.error;
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		} finally {
			sending = false;
		}
	}

	async function handleTryAnotherEmail() {
		await logout('/account');
	}
</script>

<Card class="mx-auto max-w-md">
	<CardHeader>
		<CardTitle>Verify your email</CardTitle>
		<CardDescription>
			We've sent a verification email to {user?.email || 'your email address'}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<div class="text-muted-foreground">Loading...</div>
			</div>
		{:else if user}
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">
					Please check your email and click the verification link to activate your account.
				</p>

				{#if error}
					<div class="text-sm text-destructive">{error}</div>
				{/if}

				<Button onclick={handleResend} disabled={sending} class="w-full">
					{sending ? 'Sending...' : 'Resend verification email'}
				</Button>

				<Button
					variant="outline"
					onclick={handleTryAnotherEmail}
					class="w-full"
				>
					Try another email
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>

