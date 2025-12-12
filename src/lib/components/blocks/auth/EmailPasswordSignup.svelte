<script lang="ts">
	// UI components
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
	import { CircleAlert, Eye, EyeOff } from '@lucide/svelte';

	// Auth and navigation
	import { register } from '$lib/firebase/auth';
	import { goto } from '$app/navigation';
	import { PasswordIndicator } from '$lib/components/blocks/auth';

	// Form state
	let email = $state('');
	let password = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let error = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	// Handles form submission and user registration
	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			const result = await register(email, password, firstName, lastName);
			if (result.error) {
				error = result.error;
				loading = false;
				return;
			}

			if (result.user) {
				// Redirect to verify email page
				// Note: ensureServerSession is already called in register()
				goto('/verify-email');
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
			loading = false;
		}
	}
</script>

<!-- Error alert with user-friendly messages for different error types -->
{#if error}
	<Alert variant="destructive">
		<CircleAlert />
		<AlertTitle>Whoops</AlertTitle>
		<AlertDescription>
			<p>
				{#if error === "Firebase: Error (auth/email-already-in-use)."}
					This email is already registered. Try logging in instead.
				{:else if error === "Firebase: Password should be at least 6 characters (auth/weak-password)."}
					Your password isn't strong enough.
				{:else if error === "Firebase: Error (auth/too-many-requests)."}
					You've tried too many times. Please try again in 15 minutes.
				{:else}
					We ran into an unknown problem. Please try again later.
				{/if}
			</p>
		</AlertDescription>
	</Alert>
{/if}

<!-- Registration form with name, email, and password fields -->
<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
	<!-- Name fields in a two-column grid -->
	<div class="grid grid-cols-2 gap-5">
		<div class="space-y-2.5">
			<Label for="firstName">First Name</Label>
			<Input
				id="firstName"
				type="text"
				bind:value={firstName}
				disabled={loading}
			/>
		</div>

		<div class="space-y-2.5">
			<Label for="lastName">Last Name</Label>
			<Input
				id="lastName"
				type="text"
				bind:value={lastName}
				disabled={loading}
			/>
		</div>
	</div>

	<!-- Email input field -->
	<div class="space-y-2.5">
		<Label for="email">Email</Label>
		<Input
			id="email"
			type="email"
			bind:value={email}
			required
			disabled={loading}
		/>
	</div>

	<!-- Password input with strength indicator -->
	<div class="space-y-2.5">
		<Label for="password">Password</Label>
		<div class="relative">
			<Input
				id="password"
				type={showPassword ? 'text' : 'password'}
				bind:value={password}
				required
				disabled={loading}
				class="pr-10"
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-sm text-muted-foreground"
				onclick={() => (showPassword = !showPassword)}
				disabled={loading}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
			>
				{#if showPassword}
					<EyeOff class="size-4" strokeWidth={2.1} />
				{:else}
					<Eye class="size-4" strokeWidth={2.1} />
				{/if}
			</Button>
		</div>
		<PasswordIndicator {password} />
	</div>

	<!-- Submit button with loading state -->
	<Button type="submit" class="w-full -mt-1" disabled={loading}>
		{#if loading}
			<Spinner class="size-5" />
		{/if}
		Create account
	</Button>
</form>