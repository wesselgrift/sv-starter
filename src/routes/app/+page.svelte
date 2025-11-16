<script lang="ts">
	import { userProfile } from '$lib/stores/userStore';
	import { Button } from '$lib/components/ui/button';
	import { logout } from '$lib/firebase/auth';
    import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$lib/components/ui/card'
</script>


<div class="flex flex-col gap-6 p-5">
    <Card>
        <CardHeader>
            <CardTitle>Logged In</CardTitle>
        </CardHeader>        
        <CardContent>
            <p class="text-sm"><span class="text-muted-foreground w-32 inline-block">First Name:</span> {$userProfile?.firstName ?? 'N/A'}</p>
            <p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Last Name:</span> {$userProfile?.lastName ?? 'N/A'}</p>
            <p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Email:</span> {$userProfile?.email}</p>
            <p class="text-sm"><span class="text-muted-foreground w-32 inline-block">Email Verified:</span> {$userProfile?.emailVerified ? 'Yes' : 'No'}</p>
        </CardContent>
        <CardFooter>
            <Button size="sm" class="w-fit" variant="outline" onclick={() => logout()}>Sign out</Button>
        </CardFooter>
    </Card>
</div>
