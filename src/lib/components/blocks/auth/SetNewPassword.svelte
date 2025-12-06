<script lang="ts">
    // UI component imports
    import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
    import { Spinner } from '$lib/components/ui/spinner';
    import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert'
    import { CircleCheck, CircleAlert } from '@lucide/svelte';
    
    // Firebase imports
    import { confirmPasswordReset } from 'firebase/auth';
    import { auth } from '$lib/firebase/firebase';
    
    // SvelteKit page state
    import { page } from '$app/state';
    
    // Extract oobCode and mode from URL query parameters
    const oobCode = $derived(page.url.searchParams.get('oobCode'));
    const mode = $derived(page.url.searchParams.get('mode'));
    
    // Derived state for invalid code check (from URL parameters)
    const invalidCodeFromUrl = $derived(!oobCode || !mode || mode !== 'resetPassword');
    const initialError = $derived(
        invalidCodeFromUrl 
            ? (!oobCode || !mode 
                ? 'Invalid or missing reset link. Please request a new password reset.'
                : 'Invalid action. This link is not for password reset.')
            : ''
    );
    
    // States
    let passwordReset = $state(false);
    let error = $state('');
    let password = $state('');
    let confirmPassword = $state('');
    let loading = $state(false);
    let codeInvalidatedByFirebase = $state(false);
    
    // Combined invalid code check
    const invalidCode = $derived(invalidCodeFromUrl || codeInvalidatedByFirebase);
    
    // Set initial error if code is invalid
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
        
        // Validate oobCode exists
        if (!oobCode) {
            error = 'Invalid reset link. Please request a new password reset.';
            return;
        }
        
        loading = true;
        
        try {
            await confirmPasswordReset(auth, oobCode, password);
            passwordReset = true;
        } catch (err: any) {
            // Handle specific Firebase errors
            if (err.code === 'auth/invalid-action-code' || err.code === 'auth/expired-action-code') {
                error = 'This password reset link has expired or is invalid. Please request a new one.';
                codeInvalidatedByFirebase = true;
            } else if (err.code === 'auth/weak-password') {
                error = 'Password is too weak. Please choose a stronger password.';
            } else {
                error = err.message || 'Failed to reset password. Please try again.';
            }
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

{#if invalidCode}
    <Button onclick={() => goto('/reset-password')} class="w-full">
        Request new reset link
    </Button>
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
            {#if loading }
                <Spinner class="size-5" />
                Setting new password
            {:else}
                Set new password
            {/if}
        </Button>
    </form>
{/if}

