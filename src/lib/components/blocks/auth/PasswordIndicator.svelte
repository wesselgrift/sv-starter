<script lang="ts">

	interface Props {
		password: string;
	}

	let { password }: Props = $props();

	const strength = $derived.by(() => {
		if (!password) return 0;

		let score = 0;

		// Length check
		if (password.length >= 8) score += 1;
		if (password.length >= 12) score += 1;

		// Character variety checks
		if (/[a-z]/.test(password)) score += 1;
		if (/[A-Z]/.test(password)) score += 1;
		if (/[0-9]/.test(password)) score += 1;
		if (/[^a-zA-Z0-9]/.test(password)) score += 1;

		return Math.min(score, 5);
	});

	const strengthLabel = $derived.by(() => {
		if (strength <= 2) return 'Weak';
		if (strength <= 3) return 'Fair';
		if (strength <= 4) return 'Good';
		return 'Strong';
	});

	const strengthColor = $derived.by(() => {
		if (strength <= 2) return 'bg-destructive';
		if (strength <= 3) return 'bg-yellow-500';
		if (strength <= 4) return 'bg-blue-500';
		return 'bg-green-500';
	});
</script>

{#if password}
	<div class="space-y-1">
		<div class="flex items-center justify-between text-xs">
			<span>Password strength</span>
			<span class={strengthColor === 'bg-destructive' ? 'text-destructive' : ''}>
				{strengthLabel}
			</span>
		</div>
		<div class="flex gap-1">
			{#each Array(5) as _, i}
				<div
					class="h-1 flex-1 rounded-full bg-muted"
					class:bg-destructive={i < strength && strength <= 2}
					class:bg-yellow-500={i < strength && strength > 2 && strength <= 3}
					class:bg-blue-500={i < strength && strength > 3 && strength <= 4}
					class:bg-green-500={i < strength && strength > 4}
				></div>
			{/each}
		</div>
	</div>
{/if}

