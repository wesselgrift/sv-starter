<script lang="ts">
	// User profile store
	import { userProfile } from '$lib/stores/userStore';

	// UI components
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Spinner } from '$lib/components/ui/spinner';

	// Icons
	import { DoorOpen, CircleAlert, CircleCheck, IdCardLanyard, MailIcon, RectangleEllipsisIcon } from '@lucide/svelte';

	// Firebase auth
	import { logout, linkGoogleProvider, unlinkGoogleProvider } from '$lib/firebase/auth';
	import {
		signInWithEmailAndPassword,
		onAuthStateChanged,
		EmailAuthProvider,
		reauthenticateWithCredential,
		verifyBeforeUpdateEmail,
		type User
	} from 'firebase/auth';
	import { auth } from '$lib/firebase/firebase';
	import { invalidateAll } from '$app/navigation';


	// State management
    let editingName = $state(false);
	let editingEmail = $state(false);
	let editingPassword = $state(false);
	let settingPassword = $state(false);
	let newEmail = $state('');
	let currentPasswordForEmail = $state('');
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');
	let currentUser = $state<User | null>(null);
	let disconnectingGoogle = $state(false);
	let connectingGoogle = $state(false);

	// Track current Firebase auth user
	$effect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			currentUser = user;
		});

		return () => unsubscribe();
	});

	// Provider detection
	const hasGoogleProvider = $derived(
		currentUser?.providerData.some((provider) => provider.providerId === 'google.com') ?? false
	);
	const hasEmailPasswordProvider = $derived(
		currentUser?.providerData.some((provider) => provider.providerId === 'password') ?? false
	);

	// Get provider emails
	const googleProviderData = $derived(
		currentUser?.providerData.find((provider) => provider.providerId === 'google.com')
	);
	const emailPasswordProviderData = $derived(
		currentUser?.providerData.find((provider) => provider.providerId === 'password')
	);

	const googleEmail = $derived(googleProviderData?.email || null);
	const emailPasswordEmail = $derived(emailPasswordProviderData?.email || null);

	// Determine which email to display
	const displayEmail = $derived.by(() => {
		if (hasEmailPasswordProvider && emailPasswordEmail) {
			return emailPasswordEmail;
		}
		if (hasGoogleProvider && googleEmail) {
			return googleEmail;
		}
		return $userProfile?.email || 'N/A';
	});

	// Determine if email editing is allowed
	const canEditEmail = $derived(hasEmailPasswordProvider);

	// Determine if disconnect is allowed
	const canDisconnectGoogle = $derived(hasEmailPasswordProvider);

	// Connect Google provider
	async function handleConnectGoogle() {
		error = '';
		successMessage = '';
		connectingGoogle = true;

		try {
			const result = await linkGoogleProvider();
			if (result.error) {
				error = result.error;
				connectingGoogle = false;
				return;
			}

			// Refresh the page data
			await invalidateAll();
			successMessage = 'Google account connected successfully';
			connectingGoogle = false;
		} catch (err: any) {
			error = err.message || 'Failed to connect Google account';
			connectingGoogle = false;
		}
	}

	// Disconnect Google provider
	async function handleDisconnectGoogle() {
		error = '';
		successMessage = '';
		disconnectingGoogle = true;

		try {
			const result = await unlinkGoogleProvider();
			if (result.error) {
				error = result.error;
				disconnectingGoogle = false;
				return;
			}

			// Refresh the page data
			await invalidateAll();
			successMessage = 'Google account disconnected successfully';
			disconnectingGoogle = false;
		} catch (err: any) {
			error = err.message || 'Failed to disconnect Google account';
			disconnectingGoogle = false;
		}
	}

	// Enter email edit mode
	function handleEditEmail() {
		if (!canEditEmail) {
			error = 'Please set a password first to edit your email';
			return;
		}
		editingEmail = true;
		// newEmail = displayEmail;
		currentPasswordForEmail = '';
		error = '';
		successMessage = '';
	}

	// Cancel email edit
	function handleCancelEmail() {
		editingEmail = false;
		newEmail = '';
		currentPasswordForEmail = '';
		error = '';
		successMessage = '';
	}

	// Save email changes
	async function handleSaveEmail() {
		error = '';
		successMessage = '';
		loading = true;

		try {
			// Validate email
			if (!newEmail || !newEmail.trim()) {
				error = 'Email is required';
				loading = false;
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(newEmail.trim())) {
				error = 'Invalid email format';
				loading = false;
				return;
			}

			// Check if email changed
			if (newEmail.trim() === displayEmail) {
				error = 'Email is the same as current email';
				loading = false;
				return;
			}

			// Validate password
			if (!currentPasswordForEmail) {
				error = 'Password is required to change your email';
				loading = false;
				return;
			}

			// Re-authenticate user with their current password
			if (!currentUser || !emailPasswordEmail) {
				error = 'Unable to verify your identity';
				loading = false;
				return;
			}

			try {
				const credential = EmailAuthProvider.credential(emailPasswordEmail, currentPasswordForEmail);
				await reauthenticateWithCredential(currentUser, credential);
			} catch (err: any) {
				if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
					error = 'Incorrect password';
					loading = false;
					return;
				}
				throw err;
			}

			// Get the base URL for the custom action handler
			const baseUrl =
				typeof window !== 'undefined'
					? window.location.origin
					: 'http://localhost:5173';

			const actionCodeSettings = {
				url: `${baseUrl}/auth-action`,
				handleCodeInApp: true
			};

			// Send verification email to the new email address
			await verifyBeforeUpdateEmail(currentUser, newEmail.trim(), actionCodeSettings);

			// Show success message
			successMessage = `Verification email sent to ${newEmail.trim()}. Please check your inbox and click the link to complete the email change.`;
			editingEmail = false;
			currentPasswordForEmail = '';
			loading = false;
		} catch (err: any) {
			// Handle specific Firebase errors
			if (err.code === 'auth/email-already-in-use') {
				error = 'This email is already in use by another account';
			} else if (err.code === 'auth/invalid-email') {
				error = 'Invalid email format';
			} else if (err.code === 'auth/requires-recent-login') {
				error = 'Please sign out and sign back in to change your email';
			} else {
				error = err.message || 'An error occurred';
			}
			loading = false;
		}
	}

	// Enter password edit mode (for existing password)
	function handleEditPassword() {
		editingPassword = true;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		error = '';
		successMessage = '';
	}

	// Enter set password mode (for Google-only users)
	function handleSetPassword() {
		settingPassword = true;
		newPassword = '';
		confirmPassword = '';
		error = '';
		successMessage = '';
	}

	// Cancel password edit
	function handleCancelPassword() {
		editingPassword = false;
		settingPassword = false;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		error = '';
		successMessage = '';
	}

	// Set initial password (for Google-only users)
	async function handleSetInitialPassword() {
		error = '';
		successMessage = '';
		loading = true;

		try {
			// Validate inputs
			if (!newPassword) {
				error = 'Password is required';
				loading = false;
				return;
			}

			if (newPassword.length < 6) {
				error = 'Password must be at least 6 characters long';
				loading = false;
				return;
			}

			if (newPassword !== confirmPassword) {
				error = 'Passwords do not match';
				loading = false;
				return;
			}

			// Call API to set password
			const response = await fetch('/api/auth/set-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ newPassword })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to set password';
				loading = false;
				// If session expired, suggest refreshing
				if (response.status === 401) {
					setTimeout(() => {
						window.location.reload();
					}, 2000);
				}
				return;
			}

			// Password set successfully - user needs to sign in again
			// Setting a password via Admin SDK invalidates existing tokens
			successMessage = 'Password set successfully! Please sign in again to continue.';
			settingPassword = false;
			loading = false;

			// Sign out after a short delay so user can see the message
			setTimeout(() => {
				logout('/login');
			}, 2000);
		} catch (err: any) {
			error = err.message || 'An error occurred';
			loading = false;
		}
	}

	// Save password changes (for existing password)
	async function handleSavePassword() {
		error = '';
		successMessage = '';
		loading = true;

		try {
			// Validate inputs
			if (!oldPassword) {
				error = 'Current password is required';
				loading = false;
				return;
			}

			if (!newPassword) {
				error = 'New password is required';
				loading = false;
				return;
			}

			if (newPassword.length < 6) {
				error = 'Password must be at least 6 characters long';
				loading = false;
				return;
			}

			if (newPassword !== confirmPassword) {
				error = 'New passwords do not match';
				loading = false;
				return;
			}

			if (oldPassword === newPassword) {
				error = 'New password must be different from current password';
				loading = false;
				return;
			}

			// Verify old password by attempting to sign in
			if (!emailPasswordEmail) {
				error = 'Email not found';
				loading = false;
				return;
			}

			try {
				await signInWithEmailAndPassword(auth, emailPasswordEmail, oldPassword);
			} catch (err: any) {
				if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
					error = 'Current password is incorrect';
					loading = false;
					return;
				}
				throw err;
			}

			// Call API to update password
			const response = await fetch('/api/auth/update-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ newPassword })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to update password';
				loading = false;
				return;
			}

			// Show success message
			successMessage = 'Your session has expired. Please log in with your new password.';

			// Logout after 2 seconds
			setTimeout(() => {
				logout('/login');
			}, 2000);
		} catch (err: any) {
			error = err.message || 'An error occurred';
			loading = false;
		}
	}
</script>


<div class="flex flex-col border border-border rounded-lg bg-card">

    {#if error}
        <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    {/if}

    <!-- Success Alert -->
    {#if successMessage}
        <Alert>
            <CircleCheck />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
    {/if}

    <!-- Name container -->
    <div class="flex flex-col border-border border-b p-4">

        <!-- Name / display row & edit button -->
        <div class="flex flex-row justify-between items-start">
            <div class="flex flex-row items-start gap-4">
                <IdCardLanyard strokeWidth={1.5} />
                <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">Name</span>
                    <span class="text-sm text-muted-foreground">{$userProfile?.firstName ?? 'N/A'} {$userProfile?.lastName ?? 'N/A'}</span>
                </div>
            </div>
            <!-- This button should trigger the editing mode for the name. -->
            <Button class="ml-auto" variant="outline" size="sm">Change name</Button>
        </div>

        <!-- Name / edit row (only visible when editting) -->
         {#if editingName}
            <div class="space-y-3 pl-10 py-4 max-w-md">
                <div class="space-y-2">
                    <!-- Edit name fields here, including save button and cancel button. -->
                </div>
            </div>
         {/if}
    </div>

    <!-- Email container -->
    <div class="flex flex-col border-border border-b p-4">

        <!-- Email / display row & edit button -->
        <div class="flex flex-row justify-between items-start">
            <div class="flex flex-row items-start gap-4">
                <MailIcon strokeWidth={1.5} />
                <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">Email</span>
                    <span class="text-sm text-muted-foreground">{displayEmail}</span>
                </div>
            </div>
            <div class="flex flex-row gap-4 ml-auto items-center">
                {#if !canEditEmail && hasGoogleProvider}
                    <p class="text-sm text-muted-foreground/50">
                        Set a password to change your email
                    </p>
                {/if}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={handleEditEmail}
                    disabled={loading || !!successMessage || editingEmail || !canEditEmail}
                >
                    Change email
                </Button>
            </div>
        </div>

        <!-- Email / edit row (only visible when editting) -->
        {#if editingEmail}
            <div class="space-y-3 pl-10 py-4 max-w-md">
                <div class="space-y-2">
                    <Label for="newEmail">New Email</Label>
                    <Input
                        id="newEmail"
                        type="email"
                        bind:value={newEmail}
                        disabled={loading}
                        placeholder="Enter new email"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="currentPasswordForEmail">Current Password</Label>
                    <Input
                        id="currentPasswordForEmail"
                        type="password"
                        bind:value={currentPasswordForEmail}
                        disabled={loading}
                        placeholder="Enter your password to confirm"
                    />
                </div>
                <div class="flex gap-2">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onclick={handleSaveEmail}
                        disabled={loading}
                    >
                        {#if loading}
                            <Spinner class="size-4" />
                        {/if}
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={handleCancelEmail}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Password container -->
    <div class="flex flex-col border-border border-b p-4">

        <!-- Password / display row & edit button -->
        <div class="flex flex-row justify-between">
            <div class="flex flex-row items-start gap-4">
                <RectangleEllipsisIcon strokeWidth={1.5} />
                <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">Password</span>
                    <span class="text-sm text-muted-foreground">
                        {#if hasEmailPasswordProvider}
                            •••••••••••
                        {:else if !hasEmailPasswordProvider && hasGoogleProvider}
                            No password set
                        {/if}
                    </span>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={hasEmailPasswordProvider ? handleEditPassword : (!hasEmailPasswordProvider && hasGoogleProvider ? handleSetPassword : undefined)}
                disabled={loading || !!successMessage || editingPassword || settingPassword}
                class="ml-auto"
            >
                {#if hasEmailPasswordProvider}
                    Change password
                {:else if !hasEmailPasswordProvider && hasGoogleProvider}
                    Set password
                {/if}
            </Button>
        </div>

        <!-- Password / edit row -->
        {#if editingPassword}
            <div class="space-y-3 pl-10 py-4 max-w-md">
                <div class="space-y-2">
                    <Label for="oldPassword">Current Password</Label>
                    <Input
                        id="oldPassword"
                        type="password"
                        bind:value={oldPassword}
                        disabled={loading}
                        placeholder="Enter current password"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="newPassword">New Password</Label>
                    <Input
                        id="newPassword"
                        type="password"
                        bind:value={newPassword}
                        disabled={loading}
                        placeholder="Enter new password"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="confirmPassword">Confirm New Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        bind:value={confirmPassword}
                        disabled={loading}
                        placeholder="Confirm new password"
                    />
                </div>
                <div class="flex gap-2">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onclick={handleSavePassword}
                        disabled={loading}
                    >
                        {#if loading}
                            <Spinner class="size-4" />
                        {/if}
                        Save
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={handleCancelPassword}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        {/if}

        {#if settingPassword}
            <div class="space-y-3 pl-10 py-4 max-w-md">
                <div class="space-y-2">
                    <Label for="newPasswordSet">New Password</Label>
                    <Input
                        id="newPasswordSet"
                        type="password"
                        bind:value={newPassword}
                        disabled={loading}
                        placeholder="Enter new password"
                    />
                </div>
                <div class="space-y-2">
                    <Label for="confirmPasswordSet">Confirm Password</Label>
                    <Input
                        id="confirmPasswordSet"
                        type="password"
                        bind:value={confirmPassword}
                        disabled={loading}
                        placeholder="Confirm password"
                    />
                </div>
                <div class="flex gap-2">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onclick={handleSetInitialPassword}
                        disabled={loading}
                    >
                        {#if loading}
                            <Spinner class="size-4" />
                        {/if}
                        Set Password
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={handleCancelPassword}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        {/if}
    </div>

    <!-- Google container -->
    <div class="flex flex-row items-start gap-4 border-border border-b p-4">
        <img src="/google-icon.svg" alt="Google" class="size-5" />
        <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">Google</span>
            <span class="text-sm text-muted-foreground">
                {#if hasGoogleProvider}
                    Connected
                {:else if hasEmailPasswordProvider && !hasGoogleProvider}
                    Not connected
                {/if}
            </span>
        </div>
        <div class="flex flex-row gap-4 ml-auto items-center">
            {#if hasGoogleProvider && !hasEmailPasswordProvider}
                <p class="leading-none text-sm text-muted-foreground/50">
                    Set a password before disconnecting Google.
                </p>
            {/if}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={hasGoogleProvider ? handleDisconnectGoogle : (hasEmailPasswordProvider && !hasGoogleProvider ? handleConnectGoogle : undefined)}
                disabled={loading || disconnectingGoogle || connectingGoogle || !!successMessage || !canDisconnectGoogle}
            >
                {#if hasGoogleProvider}
                    {#if disconnectingGoogle}
                        <Spinner class="size-4" />
                    {/if}
                    Disconnect
                {:else if hasEmailPasswordProvider && !hasGoogleProvider}
                    {#if connectingGoogle}
                        <Spinner class="size-4" />
                    {/if}
                    Connect
                {/if}
            </Button>
        </div>
    </div>

    <!-- Log-out -->
     <div class="flex flex-row items-start gap-4 p-4">
        <DoorOpen strokeWidth={1.5}/>
        <div class="flex flex-col gap-1">
            <span class="text-sm font-medium">Log out</span>
            <span class="text-sm text-muted-foreground">
                See you later!
            </span>
        </div>

        <Button
            type="button"
            variant="destructive"
            size="sm"
            onclick={() => logout()}
            class="ml-auto"
        >
        Log out
        </Button>
     </div>
</div>