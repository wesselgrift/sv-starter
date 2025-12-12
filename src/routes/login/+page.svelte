<script lang="ts">
	// Authentication components
	import { EmailPasswordSignin, ContinueWithGoogle } from '$lib/components/blocks/auth';
    
	// UI components
	import { Separator } from '$lib/components/ui/separator';
	import { Logo } from '$lib/components/ui/logo';
</script>

<!-- Login page container, centered vertically on large screens -->
<div class="flex justify-center lg:h-screen lg:items-center">
    <div class="animate-fade-in-zoom w-full max-w-md p-5">
        
            <!-- Logo section -->
            <div class="mb-[80px] lg:mb-10">
                <Logo class="w-28" />
            </div>

            <!-- Page heading -->
            <h2 class="mb-9 text-2xl font-medium leading-tight">Log in</h2>

            <!-- Authentication options container -->
            <div class="flex flex-col gap-5">

                <!-- Email and password sign-in form -->
                <EmailPasswordSignin />

                <!-- Divider with "Or" text overlay -->
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div class="relative flex justify-center uppercase">
                        <span class="bg-background text-sm px-2 text-muted-foreground/70 font-medium">Or</span>
                    </div>
                </div>

                <!-- Google sign-in button -->
                <ContinueWithGoogle />
                
                <!-- Link to account creation page -->
                <div class="text-center text-sm">
                    <a href="/account" class="text-muted-foreground hover:text-foreground">Create account instead</a>
                </div>
            </div>

    </div>
</div>