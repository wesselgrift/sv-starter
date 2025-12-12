<script lang="ts">
	// Auth components for signup functionality
    import { EmailPasswordSignup, ContinueWithGoogle } from '$lib/components/blocks/auth';
    
	// UI components
	import { Separator } from '$lib/components/ui/separator';
	import { Logo } from '$lib/components/ui/logo';
</script>

<div class="w-full lg:flex lg:h-screen">
	<!-- Signup form section -->
    <div class="animate-fade-in-zoom flex w-full items-start justify-center lg:w-1/2 lg:items-center mb-25 lg:mb-0">
        <div class="w-full max-w-md p-5">
            <!-- Logo header -->
            <div class="mb-[80px] lg:mb-10">
                <Logo class="w-28" />
            </div>
            <!-- Page title -->
            <h2 class="mb-9 text-2xl font-medium leading-tight text-color-foreground">Create account</h2>    
            <!-- Signup options -->
            <div class="space-y-5">
                <EmailPasswordSignup />
                <!-- Divider with "Or" text -->
                <div class="relative">
                    <div class="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div class="relative flex justify-center uppercase">
                        <span class="bg-background text-sm px-2 text-muted-foreground/70 font-medium">Or</span>
                    </div>
                </div>
                <ContinueWithGoogle />
                <!-- Link to login page -->
                <div class="text-center text-sm">
                    <a href="/login" class="text-muted-foreground hover:text-foreground">Log in instead</a>
                </div>
            </div>
        </div>
    </div>
    <!-- Decorative image section -->
    <div class="sign-up-img animate-fade-in flex h-[200px] w-full bg-zinc-950 p-8 lg:h-auto lg:w-1/2 svelte-8i5vi8"></div>
</div>

<style>
	/* Background image styling */
	.sign-up-img {
		background-image: url('/abstract-img.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
</style>