<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DoorOpen } from '@lucide/svelte';
	import { logout } from '$lib/firebase/auth';
</script>

<div class="flex flex-row items-start gap-4 p-4">
	<DoorOpen class="shrink-0" strokeWidth={1.5} />
	<div class="flex flex-col gap-1">
		<span class="text-sm font-medium">Log out</span>
		<span class="text-sm text-muted-foreground">See you later!</span>
	</div>

	<Button type="button" variant="outline" size="sm" onclick={() => logout()} class="ml-auto">
		Log out
	</Button>
</div>
