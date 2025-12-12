<script lang="ts">
	// Component imports
	import { VerifyEmailChangeAction } from '$lib/components/blocks/auth';
	import { Logo } from '$lib/components/ui/logo';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Handle Firebase redirect - extract parameters from URL if coming from Firebase's handler
	onMount(() => {
		if (typeof window === 'undefined') return;

		const urlParams = page.url.searchParams;
		const oobCode = urlParams.get('oobCode');
		const mode = urlParams.get('mode');

		// If parameters are missing, check if they're in the hash (Firebase sometimes uses hash)
		if (!oobCode || !mode) {
			const hash = window.location.hash;
			if (hash && hash.includes('oobCode')) {
				const hashParams = new URLSearchParams(hash.substring(1));
				const hashOobCode = hashParams.get('oobCode');
				const hashMode = hashParams.get('mode');
				if (hashOobCode && hashMode) {
					// Redirect with proper query parameters
					const newUrl = new URL(window.location.href);
					newUrl.searchParams.set('mode', hashMode);
					newUrl.searchParams.set('oobCode', hashOobCode);
					newUrl.hash = '';
					goto(newUrl.pathname + newUrl.search, { replaceState: true });
				}
			}
		}
	});
</script>

<!-- Main container: centers content vertically on large screens -->
<div class="flex justify-center lg:h-screen lg:items-center">
	<!-- Content wrapper with fade-in animation -->
	<div class="animate-fade-in-zoom w-full max-w-md p-5">
		<!-- Logo section with responsive bottom margin -->
		<div class="mb-[80px] lg:mb-10">
			<Logo class="w-28" />
		</div>

		<!-- Form and navigation container -->
		<div class="flex flex-col gap-5">
			<!-- Email change verification component -->
			<VerifyEmailChangeAction />
		</div>
	</div>
</div>
