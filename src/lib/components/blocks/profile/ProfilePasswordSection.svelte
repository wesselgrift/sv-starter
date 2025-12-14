<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { RectangleEllipsisIcon } from '@lucide/svelte';
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from '$lib/firebase/firebase';
	import { logout } from '$lib/firebase/auth';

	interface Props {
		hasEmailPasswordProvider: boolean;
		hasGoogleProvider: boolean;
		emailPasswordEmail: string | null;
		successMessage: string;
		onAlert: (type: 'success' | 'error', message: string) => void;
	}

	let { hasEmailPasswordProvider, hasGoogleProvider, emailPasswordEmail, successMessage, onAlert }: Props =
		$props();

	let editingPassword = $state(false);
	let settingPassword = $state(false);
	let oldPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);

	function handleEditPassword() {
		editingPassword = true;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
	}

	function handleSetPassword() {
		settingPassword = true;
		newPassword = '';
		confirmPassword = '';
	}

	function handleCancelPassword() {
		editingPassword = false;
		settingPassword = false;
		oldPassword = '';
		newPassword = '';
		confirmPassword = '';
	}

	async function handleSetInitialPassword() {
		loading = true;

		try {
			if (!newPassword) {
				onAlert('error', 'Password is required');
				loading = false;
				return;
			}

			if (newPassword.length < 6) {
				onAlert('error', 'Password must be at least 6 characters long');
				loading = false;
				return;
			}

			if (newPassword !== confirmPassword) {
				onAlert('error', 'Passwords do not match');
				loading = false;
				return;
			}

			const response = await fetch('/api/auth/set-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ newPassword })
			});

			const data = await response.json();

			if (!response.ok) {
				onAlert('error', data.error || 'Failed to set password');
				loading = false;
				if (response.status === 401) {
					setTimeout(() => {
						window.location.reload();
					}, 2000);
				}
				return;
			}

			onAlert('success', 'Password set successfully! Please sign in again to continue.');
			settingPassword = false;
			loading = false;

			setTimeout(() => {
				logout();
			}, 2000);
		} catch (err: any) {
			onAlert('error', err.message || 'An error occurred');
			loading = false;
		}
	}

	async function handleSavePassword() {
		loading = true;

		try {
			if (!oldPassword) {
				onAlert('error', 'Current password is required');
				loading = false;
				return;
			}

			if (!newPassword) {
				onAlert('error', 'New password is required');
				loading = false;
				return;
			}

			if (newPassword.length < 6) {
				onAlert('error', 'Password must be at least 6 characters long');
				loading = false;
				return;
			}

			if (newPassword !== confirmPassword) {
				onAlert('error', 'New passwords do not match');
				loading = false;
				return;
			}

			if (oldPassword === newPassword) {
				onAlert('error', 'New password must be different from current password');
				loading = false;
				return;
			}

			if (!emailPasswordEmail) {
				onAlert('error', 'Email not found');
				loading = false;
				return;
			}

			try {
				await signInWithEmailAndPassword(auth, emailPasswordEmail, oldPassword);
			} catch (err: any) {
				if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
					onAlert('error', 'Current password is incorrect');
					loading = false;
					return;
				}
				throw err;
			}

			const response = await fetch('/api/auth/update-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ newPassword })
			});

			const data = await response.json();

			if (!response.ok) {
				onAlert('error', data.error || 'Failed to update password');
				loading = false;
				return;
			}

			onAlert('success', 'Your session has expired. Please log in with your new password.');

			setTimeout(() => {
				logout();
			}, 2000);
		} catch (err: any) {
			onAlert('error', err.message || 'An error occurred');
			loading = false;
		}
	}
</script>

<div class="flex flex-col border-border border-b p-4">
	<div class="flex flex-row justify-between">
		<div class="flex flex-row items-start gap-4">
			<RectangleEllipsisIcon class="shrink-0" strokeWidth={1.5} />
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
			onclick={hasEmailPasswordProvider
				? handleEditPassword
				: !hasEmailPasswordProvider && hasGoogleProvider
					? handleSetPassword
					: undefined}
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

	{#if editingPassword}
		<div class="space-y-5 pl-10 py-4 max-w-md">
			<div class="space-y-2.5">
				<Label for="oldPassword">Current Password</Label>
				<Input
					id="oldPassword"
					type="password"
					bind:value={oldPassword}
					disabled={loading}
					placeholder="Enter current password"
				/>
			</div>
			<div class="space-y-2.5">
				<Label for="newPassword">New Password</Label>
				<Input
					id="newPassword"
					type="password"
					bind:value={newPassword}
					disabled={loading}
					placeholder="Enter new password"
				/>
			</div>
			<div class="space-y-2.5">
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
				<Button type="button" variant="default" size="sm" onclick={handleSavePassword} disabled={loading}>
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
		<div class="space-y-5 pl-10 py-4 max-w-md">
			<div class="space-y-2.5">
				<Label for="newPasswordSet">New Password</Label>
				<Input
					id="newPasswordSet"
					type="password"
					bind:value={newPassword}
					disabled={loading}
					placeholder="Enter new password"
				/>
			</div>
			<div class="space-y-2.5">
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
