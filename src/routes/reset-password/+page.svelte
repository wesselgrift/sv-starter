<script lang="ts">
	import ResetPassword from '$lib/components/blocks/auth/ResetPassword.svelte';
	import { Logo } from '$lib/components/ui/logo'
</script>

<div class="flex justify-center lg:h-screen lg:items-center">
    <div class="w-full max-w-md p-5">
        <div class="mb-[80px] lg:mb-10">
            <Logo class="w-28" />
        </div>

        <h2 class="mb-9 text-2xl font-medium leading-tight text-color-foreground">Reset password</h2>

        <ResetPassword />

        <div class="mt-5 text-center text-sm">
            <a href="/login" class="text-muted-foreground hover:text-foreground">Back to sign in</a>
        </div>
    </div>
</div>