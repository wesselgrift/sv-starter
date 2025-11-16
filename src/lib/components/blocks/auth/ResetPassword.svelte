<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
    import { Spinner } from '$lib/components/ui/spinner';
	import { resetPassword } from '$lib/firebase/auth';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleSubmit() {
		error = '';
		success = false;
		loading = true;

		try {
			const result = await resetPassword(email);
			if (result.error) {
				error = result.error;
			} else {
				success = true;
			}
		} catch (err: any) {
			error = err.message || 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

{#if error}
    <div class="text-sm text-destructive">{error}</div>
{/if}

{#if success}
    <div class="text-sm text-green-600">
        Password reset email sent! Check your inbox.
    </div>
{/if}

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
	<div class="space-y-2.5">
		<Label for="email">Email</Label>
		<Input
			id="email"
			type="email"
			bind:value={email}
			required
			disabled={loading}
		/>
        <p class="block text-left text-sm text-muted-foreground">
            Fill in your email address and we'll send you a link to reset your password.
        </p>
	</div>

	<Button type="submit" class="w-full" disabled={loading}>
		{#if loading }
            <Spinner class="size-5" />
            Sending
        {:else}
            Send reset mail
        {/if}
	</Button>
</form>

