<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog';
	import { Trash2 } from '@lucide/svelte';
	import { deleteAccount } from '$lib/firebase/auth';

	interface Props {
		onAlert: (type: 'success' | 'error', message: string) => void;
	}

	let { onAlert }: Props = $props();

	let deleteDialogOpen = $state(false);
	let deletingAccount = $state(false);

	async function handleDeleteAccount() {
		deletingAccount = true;
		const result = await deleteAccount();
		if (result.error) {
			onAlert('error', result.error);
			deletingAccount = false;
			deleteDialogOpen = false;
		}
	}
</script>

<h3 class="text-lg font-medium mb-4">Danger zone</h3>
<div class="flex flex-col border border-red-100 dark:border-red-900 rounded-lg bg-card overflow-hidden">
	<div class="flex flex-row items-start gap-4 p-4 bg-red-50/70 dark:bg-red-950/70">
		<Trash2 class="text-red-700 dark:text-red-300 shrink-0" strokeWidth={1.5} />
		<div class="flex flex-col gap-1">
			<span class="text-sm font-medium text-red-700 dark:text-red-300">Delete account</span>
			<span class="text-sm text-muted-foreground text-red-700/80 dark:text-red-300/80">
				This permanently deletes your account and all associated data.
			</span>
		</div>
		<AlertDialog bind:open={deleteDialogOpen}>
			<AlertDialogTrigger class="ml-auto">
				<Button type="button" variant="destructive" size="sm" class="ml-auto">
					Delete account
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account and remove your
						data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onclick={handleDeleteAccount} disabled={deletingAccount}>
						{#if deletingAccount}
							<Spinner class="mr-2 h-4 w-4" />
						{/if}
						Yes, delete my account
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</div>
</div>
