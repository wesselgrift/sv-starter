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

    const strengthTextColor = $derived.by(() => {
        if (strength <= 2) return 'text-destructive';
		if (strength <= 3) return 'text-yellow-500';
		if (strength <= 4) return 'text-lime-500';
		return 'text-green-500';
    });

	const getBarClass = (index: number) => {
		if (index >= strength) return 'bg-muted';
		if (strength <= 2) return 'bg-destructive';
		if (strength <= 3) return 'bg-yellow-500';
		if (strength <= 4) return 'bg-lime-500';
		return 'bg-green-500';
	};
</script>

{#if password}
	<div class="space-y-1.5 h-12">
        <div class="flex gap-1">
            {#each Array(5) as _, i}
                <div class="h-1 flex-1 rounded-full {getBarClass(i)}"></div>
			{/each}
		</div>
        <div class="flex items-center justify-between text-sm">
            <span class={strengthTextColor}>
                {strengthLabel} password
            </span>
        </div>
	</div>
{:else}

    <p class="bloc h-12 text-left text-sm text-muted-foreground/80">
        Use a password with at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number
        and 1 special character.
    </p>

{/if}

