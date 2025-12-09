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
	import { Pencil, CircleAlert, CheckCircle2 } from '@lucide/svelte';

	// Firebase auth
	import { logout } from '$lib/firebase/auth';
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase/firebase';

	// State management
	let editingEmail = $state(false);
	let editingPassword = $state(false);
	let newEmail = $state('');
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');

	// Enter email edit mode
	function handleEditEmail() {
		editingEmail = true;
		newEmail = $userProfile?.email || '';
		error = '';
		successMessage = '';
	}

	// Cancel email edit
	function handleCancelEmail() {
		editingEmail = false;
		newEmail = '';
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
			if (newEmail.trim() === $userProfile?.email) {
				error = 'Email is the same as current email';
				loading = false;
				return;
			}

			// Call API to update email
			const response = await fetch('/api/auth/update-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ newEmail: newEmail.trim() })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to update email';
				loading = false;
				return;
			}

			// Show success message
			successMessage = `Your session has expired. Please log in with your new email: ${newEmail.trim()}`;

			// Logout after 2 seconds
			setTimeout(() => {
				logout('/login');
			}, 2000);
		} catch (err: any) {
			error = err.message || 'An error occurred';
			loading = false;
		}
	}

	// Enter password edit mode
	function handleEditPassword() {
		editingPassword = true;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		error = '';
		successMessage = '';
	}

	// Cancel password edit
	function handleCancelPassword() {
		editingPassword = false;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
		error = '';
		successMessage = '';
	}

	// Save password changes
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
			if (!$userProfile?.email) {
				error = 'Email not found';
				loading = false;
				return;
			}

			try {
				await signInWithEmailAndPassword(auth, $userProfile.email, oldPassword);
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

<div class="space-y-6 mt-6">
	<!-- Error Alert -->
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
			<CheckCircle2 />
			<AlertTitle>Success</AlertTitle>
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	{/if}

	<!-- Email Section -->
	<div class="space-y-2">
		<Label>Email</Label>
		{#if !editingEmail}
			<div class="flex items-center gap-2">
				<span class="text-sm">{$userProfile?.email || 'N/A'}</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onclick={handleEditEmail}
					disabled={loading || !!successMessage}
				>
					<Pencil class="size-4" />
					Edit
				</Button>
			</div>
		{:else}
			<div class="space-y-3">
				<Input
					type="email"
					bind:value={newEmail}
					disabled={loading}
					placeholder="Enter new email"
				/>
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

	<!-- Password Section -->
	<div class="space-y-2">
		<Label>Password</Label>
		{#if !editingPassword}
			<div class="flex items-center gap-2">
				<span class="text-sm">••••••••</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onclick={handleEditPassword}
					disabled={loading || !!successMessage}
				>
					<Pencil class="size-4" />
					Edit
				</Button>
			</div>
		{:else}
			<div class="space-y-3">
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
	</div>
</div>
