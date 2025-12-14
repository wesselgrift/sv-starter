<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { linkGoogleProvider, unlinkGoogleProvider } from '$lib/firebase/auth';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		hasGoogleProvider: boolean;
		hasEmailPasswordProvider: boolean;
		canDisconnectGoogle: boolean;
		successMessage: string;
		onAlert: (type: 'success' | 'error', message: string) => void;
		onRefreshUser: () => Promise<void>;
	}

	let {
		hasGoogleProvider,
		hasEmailPasswordProvider,
		canDisconnectGoogle,
		successMessage,
		onAlert,
		onRefreshUser
	}: Props = $props();

	let disconnectingGoogle = $state(false);
	let connectingGoogle = $state(false);

	async function handleConnectGoogle() {
		connectingGoogle = true;

		try {
			const result = await linkGoogleProvider();
			if (result.error) {
				onAlert('error', result.error);
				return;
			}

			await invalidateAll();
			onAlert('success', 'Google account connected successfully');
		} catch (err: any) {
			onAlert('error', err.message || 'Failed to connect Google account');
		} finally {
			await onRefreshUser();
			connectingGoogle = false;
		}
	}

	async function handleDisconnectGoogle() {
		disconnectingGoogle = true;

		try {
			const result = await unlinkGoogleProvider();
			if (result.error) {
				onAlert('error', result.error);
				return;
			}

			await invalidateAll();
			onAlert('success', 'Google account disconnected successfully');
		} catch (err: any) {
			onAlert('error', err.message || 'Failed to disconnect Google account');
		} finally {
			await onRefreshUser();
			disconnectingGoogle = false;
		}
	}
</script>

<div class="flex flex-row items-start gap-4 border-border border-b p-4">
	<img src="/google-icon.svg" alt="Google" class="size-5 shrink-0" />
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
			onclick={hasGoogleProvider
				? handleDisconnectGoogle
				: hasEmailPasswordProvider && !hasGoogleProvider
					? handleConnectGoogle
					: undefined}
			disabled={disconnectingGoogle ||
				connectingGoogle ||
				!!successMessage ||
				!canDisconnectGoogle}
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
