<script lang="ts">
	// User profile store for accessing current user data
	import { userProfile } from '$lib/stores/userStore';
    
	// UI components
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card';
    import { UserProfile } from '$lib/components/blocks/auth';

	// Firebase authentication function for signing out
	import { logout } from '$lib/firebase/auth';
</script>

<!-- Main container displaying user profile information -->
<div class="flex flex-col gap-6 p-5">
	<Card>
		<CardHeader>
			<CardTitle>Logged In</CardTitle>
		</CardHeader>
		<!-- Display user profile details with fallback values -->
		<CardContent>
			<p class="text-sm"><span class="text-muted-foreground w-32 inline-block">First Name:</span> {$userProfile?.firstName ?? 'N/A'}</p>
			<p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Last Name:</span> {$userProfile?.lastName ?? 'N/A'}</p>
			<p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Email:</span> {$userProfile?.email}</p>
			<p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Email Verified:</span> {$userProfile?.emailVerified ? 'Yes' : 'No'}</p>

            <UserProfile />
		</CardContent>
		<CardFooter>
			<!-- Sign out button that calls the logout function -->
			<Button size="sm" class="w-fit" variant="outline" onclick={() => logout()}>Sign out</Button>
		</CardFooter>
	</Card>
</div>
