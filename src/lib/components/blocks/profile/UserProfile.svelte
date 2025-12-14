<script lang="ts">
	import { userProfile } from '$lib/stores/userStore';
	import { onAuthStateChanged, type User } from 'firebase/auth';
	import { auth } from '$lib/firebase/firebase';

	import ProfileAlerts from './ProfileAlerts.svelte';
	import ProfileNameSection from './ProfileNameSection.svelte';
	import ProfileEmailSection from './ProfileEmailSection.svelte';
	import ProfilePasswordSection from './ProfilePasswordSection.svelte';
	import ProfileGoogleSection from './ProfileGoogleSection.svelte';
	import ProfileLogoutSection from './ProfileLogoutSection.svelte';
	import ProfileDangerZone from './ProfileDangerZone.svelte';

	// State management
	let error = $state('');
	let successMessage = $state('');
	let currentUser = $state<User | null>(null);
	let alertTimeout: ReturnType<typeof setTimeout> | null = null;

	// Auto-dismiss alerts after 2.5 seconds
	function showAlert(type: 'success' | 'error', message: string) {
		if (alertTimeout) {
			clearTimeout(alertTimeout);
		}

		if (type === 'success') {
			error = '';
			successMessage = message;
		} else {
			successMessage = '';
			error = message;
		}

		alertTimeout = setTimeout(() => {
			successMessage = '';
			error = '';
			alertTimeout = null;
		}, 2500);
	}

	// Track current Firebase auth user
	$effect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			currentUser = user;
		});

		return () => unsubscribe();
	});

	// Force refresh current user state to trigger reactivity
	async function refreshCurrentUser() {
		const user = auth.currentUser;
		if (user) {
			await user.reload();
			currentUser = null;
			currentUser = auth.currentUser;
		}
	}

	// Provider detection
	const hasGoogleProvider = $derived(
		currentUser?.providerData.some((provider) => provider.providerId === 'google.com') ?? false
	);
	const hasEmailPasswordProvider = $derived(
		currentUser?.providerData.some((provider) => provider.providerId === 'password') ?? false
	);

	// Get provider emails
	const googleProviderData = $derived(
		currentUser?.providerData.find((provider) => provider.providerId === 'google.com')
	);
	const emailPasswordProviderData = $derived(
		currentUser?.providerData.find((provider) => provider.providerId === 'password')
	);

	const googleEmail = $derived(googleProviderData?.email || null);
	const emailPasswordEmail = $derived(emailPasswordProviderData?.email || null);

	// Determine which email to display
	const displayEmail = $derived.by(() => {
		if (hasEmailPasswordProvider && emailPasswordEmail) {
			return emailPasswordEmail;
		}
		if (hasGoogleProvider && googleEmail) {
			return googleEmail;
		}
		return $userProfile?.email || 'N/A';
	});

	// Determine if email editing is allowed
	const canEditEmail = $derived(hasEmailPasswordProvider);

	// Determine if disconnect is allowed
	const canDisconnectGoogle = $derived(hasEmailPasswordProvider);
</script>

<ProfileAlerts {error} {successMessage} />

<div class="flex flex-col border border-border rounded-lg bg-card overflow-hidden mb-8">
	<ProfileNameSection userProfile={$userProfile} {successMessage} onAlert={showAlert} />

	<ProfileEmailSection
		{currentUser}
		{displayEmail}
		{canEditEmail}
		{emailPasswordEmail}
		{hasGoogleProvider}
		{successMessage}
		onAlert={showAlert}
	/>

	<ProfilePasswordSection
		{hasEmailPasswordProvider}
		{hasGoogleProvider}
		{emailPasswordEmail}
		{successMessage}
		onAlert={showAlert}
	/>

	<ProfileGoogleSection
		{hasGoogleProvider}
		{hasEmailPasswordProvider}
		{canDisconnectGoogle}
		{successMessage}
		onAlert={showAlert}
		onRefreshUser={refreshCurrentUser}
	/>

	<ProfileLogoutSection />
</div>

<ProfileDangerZone onAlert={showAlert} />
