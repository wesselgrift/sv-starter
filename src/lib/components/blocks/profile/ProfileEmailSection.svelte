<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { MailIcon } from '@lucide/svelte';
	import {
		EmailAuthProvider,
		reauthenticateWithCredential,
		type User
	} from 'firebase/auth';

	interface Props {
		currentUser: User | null;
		displayEmail: string;
		canEditEmail: boolean;
		emailPasswordEmail: string | null;
		hasGoogleProvider: boolean;
		successMessage: string;
		onAlert: (type: 'success' | 'error', message: string) => void;
	}

	let {
		currentUser,
		displayEmail,
		canEditEmail,
		emailPasswordEmail,
		hasGoogleProvider,
		successMessage,
		onAlert
	}: Props = $props();

	let editingEmail = $state(false);
	let newEmail = $state('');
	let currentPasswordForEmail = $state('');
	let loading = $state(false);

	function handleEditEmail() {
		if (!canEditEmail) {
			onAlert('error', 'Please set a password first to edit your email');
			return;
		}
		editingEmail = true;
		currentPasswordForEmail = '';
	}

	function handleCancelEmail() {
		editingEmail = false;
		newEmail = '';
		currentPasswordForEmail = '';
	}

	async function handleSaveEmail() {
		loading = true;

		try {
			if (!newEmail || !newEmail.trim()) {
				onAlert('error', 'Email is required');
				loading = false;
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(newEmail.trim())) {
				onAlert('error', 'Invalid email format');
				loading = false;
				return;
			}

			if (newEmail.trim() === displayEmail) {
				onAlert('error', 'Email is the same as current email');
				loading = false;
				return;
			}

			if (!currentPasswordForEmail) {
				onAlert('error', 'Password is required to change your email');
				loading = false;
				return;
			}

			if (!currentUser || !emailPasswordEmail) {
				onAlert('error', 'Unable to verify your identity');
				loading = false;
				return;
			}

		try {
			const credential = EmailAuthProvider.credential(emailPasswordEmail, currentPasswordForEmail);
			await reauthenticateWithCredential(currentUser, credential);
		} catch (err: any) {
			if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
				onAlert('error', 'Incorrect password');
				loading = false;
				return;
			}
			throw err;
		}

		// Send email change verification via Loops API
		const response = await fetch('/api/auth/send-email-change', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				currentEmail: displayEmail,
				newEmail: newEmail.trim()
			})
		});

		if (!response.ok) {
			const data = await response.json();
			onAlert('error', data.error || 'Failed to send verification email');
			loading = false;
			return;
		}

		onAlert(
			'success',
			`Verification email sent to ${newEmail.trim()}. Please check your inbox and click the link to complete the email change.`
		);
		editingEmail = false;
		currentPasswordForEmail = '';
		loading = false;
	} catch (err: any) {
		if (err.code === 'auth/email-already-in-use') {
			onAlert('error', 'This email is already in use by another account');
		} else if (err.code === 'auth/invalid-email') {
			onAlert('error', 'Invalid email format');
		} else if (err.code === 'auth/requires-recent-login') {
			onAlert('error', 'Please sign out and sign back in to change your email');
		} else {
			onAlert('error', err.message || 'An error occurred');
		}
		loading = false;
	}
}
</script>

<div class="flex flex-col border-border border-b p-4">
	<div class="flex flex-row justify-between items-start">
		<div class="flex flex-row items-start gap-4">
			<MailIcon class="shrink-0" strokeWidth={1.5} />
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">Email</span>
				<span class="text-sm text-muted-foreground">{displayEmail}</span>
			</div>
		</div>
		<div class="flex flex-row gap-4 ml-auto items-center">
			{#if !canEditEmail && hasGoogleProvider}
				<p class="text-sm text-muted-foreground/50">Set a password to change your email</p>
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

	{#if editingEmail}
		<div class="space-y-5 pl-10 py-4 max-w-md">
			<div class="space-y-2.5">
				<Label for="newEmail">New Email</Label>
				<Input
					id="newEmail"
					type="email"
					bind:value={newEmail}
					disabled={loading}
					placeholder="Enter new email"
				/>
			</div>
			<div class="space-y-2.5">
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
				<Button type="button" variant="default" size="sm" onclick={handleSaveEmail} disabled={loading}>
					{#if loading}
						<Spinner class="size-4" />
					{/if}
					Save
				</Button>
				<Button type="button" variant="outline" size="sm" onclick={handleCancelEmail} disabled={loading}>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</div>
