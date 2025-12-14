<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { UserRoundX } from '@lucide/svelte';
</script>

<div class="flex flex-col min-h-screen items-center justify-center p-5">
	<div class="max-w-2xl flex flex-col items-center justify-center gap-4">
		<UserRoundX size="40" strokeWidth="1.3"/>
		<p class="text-base">Your account has been deleted.</p>
	</div>
</div>
