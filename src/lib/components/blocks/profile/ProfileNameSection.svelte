<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { IdCardLanyard } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';
	import type { UserProfile } from '$lib/stores/userStore';

	interface Props {
		userProfile: UserProfile | null;
		successMessage: string;
		onAlert: (type: 'success' | 'error', message: string) => void;
	}

	let { userProfile, successMessage, onAlert }: Props = $props();

	let editingName = $state(false);
	let newFirstName = $state('');
	let newLastName = $state('');
	let savingName = $state(false);

	function handleEditName() {
		editingName = true;
		newFirstName = userProfile?.firstName ?? '';
		newLastName = userProfile?.lastName ?? '';
	}

	function handleCancelName() {
		editingName = false;
		newFirstName = '';
		newLastName = '';
	}

	async function handleSaveName() {
		const trimmedFirstName = newFirstName.trim();
		const trimmedLastName = newLastName.trim();

		if (!trimmedFirstName || !trimmedLastName) {
			onAlert('error', 'First name and last name are required');
			return;
		}

		if (
			trimmedFirstName === (userProfile?.firstName ?? '') &&
			trimmedLastName === (userProfile?.lastName ?? '')
		) {
			editingName = false;
			newFirstName = '';
			newLastName = '';
			return;
		}

		savingName = true;

		try {
			const response = await fetch('/api/auth/update-profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					firstName: trimmedFirstName,
					lastName: trimmedLastName
				})
			});

			const data = await response.json();

			if (!response.ok) {
				onAlert('error', data.error || 'Failed to update name');
				savingName = false;
				return;
			}

			await invalidateAll();
			onAlert('success', 'Name updated successfully');
			editingName = false;
			newFirstName = '';
			newLastName = '';
			savingName = false;
		} catch (err: any) {
			onAlert('error', err.message || 'An error occurred');
			savingName = false;
		}
	}
</script>

<div class="flex flex-col border-border border-b p-4">
	<div class="flex flex-row justify-between items-start">
		<div class="flex flex-row items-start gap-4">
			<IdCardLanyard class="shrink-0" strokeWidth={1.5} />
			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">Name</span>
				<span class="text-sm text-muted-foreground">
					{userProfile?.firstName ?? 'N/A'}
					{userProfile?.lastName ?? 'N/A'}
				</span>
			</div>
		</div>
		<Button
			type="button"
			variant="outline"
			size="sm"
			onclick={handleEditName}
			disabled={savingName || !!successMessage || editingName}
			class="ml-auto"
		>
			Change name
		</Button>
	</div>

	{#if editingName}
		<div class="space-y-5 pl-10 py-4 max-w-md">
			<div class="space-y-2.5">
				<Label for="newFirstName">First Name</Label>
				<Input
					id="newFirstName"
					type="text"
					bind:value={newFirstName}
					disabled={savingName}
					placeholder="Enter first name"
				/>
			</div>
			<div class="space-y-2.5">
				<Label for="newLastName">Last Name</Label>
				<Input
					id="newLastName"
					type="text"
					bind:value={newLastName}
					disabled={savingName}
					placeholder="Enter last name"
				/>
			</div>
			<div class="flex gap-2">
				<Button type="button" variant="default" size="sm" onclick={handleSaveName} disabled={savingName}>
					{#if savingName}
						<Spinner class="size-4" />
					{/if}
					Save
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onclick={handleCancelName}
					disabled={savingName}
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</div>
