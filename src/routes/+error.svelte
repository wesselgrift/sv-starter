<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	function goBack() {
		if (browser) window.history.back();
	}
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center px-4">
	<Card class="max-w-md">
		<CardHeader>
			<CardTitle>Something went wrong</CardTitle>
			<CardDescription>
				{#if page.error?.status === 404}
					The page you're looking for doesn't exist.
				{:else}
					An unexpected error occurred.
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if page.error?.message}
				<div class="text-sm text-destructive">{page.error.message}</div>
			{/if}
			<Button onclick={goBack} class="w-full">Go back</Button>
		</CardContent>
	</Card>
</div>