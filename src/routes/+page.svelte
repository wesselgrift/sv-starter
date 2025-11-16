<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<div class="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
	<div class="mx-auto max-w-2xl space-y-8 text-center">
		<div class="space-y-4">
			<h1 class="text-4xl font-bold tracking-tight sm:text-6xl">
				Welcome to SvelteKit Starter
			</h1>
			<p class="text-lg text-muted-foreground">
				A modern boilerplate for building digital products with SvelteKit, Firebase, and
				shadcn-svelte.
			</p>
		</div>

		<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
			<Button size="lg">
				<a href="/account">Get started</a>
			</Button>
			<Button variant="outline" size="lg">
				<a href="/login">Sign in</a>
			</Button>
		</div>

		<div class="pt-8">
			<a
				href="https://github.com"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-muted-foreground hover:text-foreground"
			>
				View on GitHub →
			</a>
		</div>
	</div>
</div>