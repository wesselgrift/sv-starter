<script lang="ts">
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { fly } from 'svelte/transition';
	import { CircleAlert, CircleCheck } from '@lucide/svelte';

	interface Props {
		error: string;
		successMessage: string;
	}

	let { error, successMessage }: Props = $props();
</script>

{#if error}
	<div transition:fly={{ y: 20, duration: 300 }}>
		<Alert variant="destructive" class="mb-4">
			<CircleAlert />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	</div>
{/if}

{#if successMessage}
	<div transition:fly={{ y: 20, duration: 300 }}>
		<Alert class="text-green-700 dark:text-green-500 mb-4">
			<CircleCheck />
			<AlertTitle>Success</AlertTitle>
			<AlertDescription>{successMessage}</AlertDescription>
		</Alert>
	</div>
{/if}
