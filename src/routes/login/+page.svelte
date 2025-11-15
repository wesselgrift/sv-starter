<script lang="ts">
	import EmailPasswordSignin from '$lib/components/blocks/auth/EmailPasswordSignin.svelte';
	import ContinueWithGoogle from '$lib/components/blocks/auth/ContinueWithGoogle.svelte';
	import { loading } from '$lib/stores/userStore';
	import { Separator } from '$lib/components/ui/separator';
	import Logo from '$lib/components/ui/logo/logo.svelte';
</script>


<div class="flex justify-center lg:h-screen lg:items-center">
    <div class="w-full max-w-md p-5">

		{#if $loading}
			<div class="flex items-center justify-center py-8">
				<div class="text-muted-foreground">Loading...</div>
			</div>
		{:else}
        
            <div class="mb-[80px] lg:mb-10">
                <Logo width="w-28" />
            </div>

            <h2 class="mb-9 text-2xl font-medium leading-tight">Log in</h2>

            <div class="flex flex-col gap-5">

                <EmailPasswordSignin />

                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div class="relative flex justify-center uppercase">
                        <span class="bg-background text-sm px-2 text-muted-foreground/70 font-medium">Or</span>
                    </div>
                </div>

                <ContinueWithGoogle />
                
                <div class="text-center text-sm">
                    <a href="/account" class="text-muted-foreground hover:text-foreground">Create account</a>
                </div>
            </div>

		{/if}

    </div>
</div>