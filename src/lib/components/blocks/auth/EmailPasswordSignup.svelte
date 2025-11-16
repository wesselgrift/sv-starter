<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
    import { Spinner } from '$lib/components/ui/spinner'
    import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
    import { CircleAlert } from '@lucide/svelte';

	import { register } from '$lib/firebase/auth';
	import { goto } from '$app/navigation';
	import PasswordIndicator from './PasswordIndicator.svelte';

	let email = $state('');
	let password = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let error = $state('');
	let loading = $state(false);

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

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
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

	<div class="space-y-2.5">
		<Label for="password">Password</Label>
		<Input
			id="password"
			type="password"
			bind:value={password}
			required
			disabled={loading}
		/>
		<PasswordIndicator {password} />
	</div>

	<Button type="submit" class="w-full -mt-1" disabled={loading}>
		{#if loading}
			<Spinner class="size-5" />
		{/if}
        Create account
	</Button>
</form>