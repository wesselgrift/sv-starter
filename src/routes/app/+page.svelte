<script lang="ts">
	// User profile store for accessing current user data
	import { userProfile } from '$lib/stores/userStore';

    // UI components
    import { Button } from '$lib/components/ui/button';

    // Firebase auth
    import { logout } from '$lib/firebase/auth';

    // Icons
    import { IdCardLanyardIcon, DoorOpenIcon } from '@lucide/svelte';
</script>

<!-- Main container displaying user profile information -->
<h2 class="text-2xl font-semibold mb-2">Hey {$userProfile?.firstName}, <br> welcome to FireSvelte 👋</h2>
<p class="text-muted-foreground text-sm mb-5">Welcome in the (empty) app. Let's build something!</p>

<div class="flex flex-row gap-4">
    <Button 
        href="app/account"
        size="sm"
        variant="outline"
        class="w-fit"
    >
        <IdCardLanyardIcon strokeWidth={1.5} />
        Account
    </Button>
    <Button 
        onclick={() => logout()}
        size="sm"
        variant="outline"
        class="w-fit"
    >
        <DoorOpenIcon strokeWidth={1.5} />
        Logout
    </Button>
</div>
