<script lang="ts">
	// Component imports
	import { ResetPassword } from '$lib/components/blocks/auth';
	import { Logo } from '$lib/components/ui/logo'
</script>

<!-- Main container: centers content vertically on large screens -->
<div class="flex justify-center lg:h-screen lg:items-center">
    <!-- Content wrapper with fade-in animation -->
    <div class="animate-fade-in-zoom w-full max-w-md p-5">
        <!-- Logo section with responsive bottom margin -->
        <div class="mb-[80px] lg:mb-10">
            <Logo class="w-28" />
        </div>

        <!-- Page heading -->
        <h2 class="mb-9 text-2xl font-medium leading-tight text-color-foreground">Reset password</h2>

        <!-- Form and navigation container -->
        <div class="flex flex-col gap-5">
            <!-- Reset password form component -->
            <ResetPassword />

            <!-- Back to login link -->
            <div class="text-center text-sm">
                <a href="/login" class="text-muted-foreground hover:text-foreground">Back to sign in</a>
            </div>
        </div>
    </div>
</div>


            