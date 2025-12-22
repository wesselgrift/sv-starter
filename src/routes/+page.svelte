<script lang="ts">
	// Import Button component from shadcn-svelte UI library
	import { Button } from '$lib/components/ui/button';
</script>

<!-- Landing page hero section -->
<div class="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
	<div class="animate-fade-in-zoom mx-auto max-w-2xl space-y-8 text-center">
		<!-- Hero heading and description -->
		<div class="space-y-4">
			<h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
				Welcome to FireSvelte
			</h1>
			<p class="text-lg text-muted-foreground">
				A modern boilerplate for building digital products with SvelteKit, Firebase auth and database, shadcn-svelte and Loops for emailing.
			</p>
		</div>

		<!-- Call-to-action buttons -->
		<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
			<Button href="/account" size="lg">
				Get started
			</Button>
			<Button href="/login" variant="outline" size="lg">
				Sign in
			</Button>
		</div>

		<!-- GitHub repository link -->
		<div class="pt-8">
			<a
				href="https://github.com/wesselgrift/firesvelte"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-muted-foreground hover:text-foreground"
			>
				View on GitHub →
			</a>
		</div>
	</div>
</div>