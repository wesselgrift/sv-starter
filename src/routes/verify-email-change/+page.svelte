<script lang="ts">
	/**
	 * Email Change Verification Page
	 *
	 * Simple page wrapper for the VerifyEmailChangeAction component.
	 * URL format: /verify-email-change?token=xxx
	 */

	// Component imports
	import { VerifyEmailChangeAction } from '$lib/components/blocks/auth';
	import { Logo } from '$lib/components/ui/logo';
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
