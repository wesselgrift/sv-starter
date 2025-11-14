<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

    import { Telescope } from '@lucide/svelte';

	function goBack() {
		if (browser) window.history.back();
	}
</script>

<div class="flex flex-col min-h-screen items-center justify-center p-5">
    <div class="max-w-2xl flex flex-col items-center justify-center gap-4">
        <Telescope size="40" strokeWidth="1.3"/>
        <p class="text-base">Whoops, we couldn't find that page.</p>
        <Button variant="outline" onclick={goBack}>Go back</Button>
    </div>
</div>