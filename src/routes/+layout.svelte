<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/base/Sidebar.svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	let { children } = $props();
	
	let isAuthenticated = $state(false);
	let lastValidated = $state(0);
	let isValidating = $state(false);
	const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
	
	// Handle initial authentication check
	onMount(async () => {
		if (browser) {
			const currentPath = window.location.pathname;
			// Skip auth check if on auth page
			if (currentPath === '/auth') {
				return;
			}
			await checkAuthentication();
		}
	});
	
	// Optimize route change authentication checks
	$effect(() => {
		if (browser && $page) {
			const currentPath = $page.url.pathname;
			// Skip auth check if on auth page
			if (currentPath === '/auth') {
				return;
			}
			
			// Only do a full validation if we haven't validated recently
			if (!isValidating) {
				checkAuthentication();
			}
		}
	});
	
	async function checkAuthentication() {
		const authKey = localStorage.getItem('authKey');
		
		// If no auth key exists, immediately redirect
		if (!authKey) {
			isAuthenticated = false;
			goto('/auth');
			return;
		}

		// Check if we already validated recently
		const now = Date.now();
		if (now - lastValidated < AUTH_CACHE_DURATION && isAuthenticated) {
			// Auth has been validated recently, no need to check again
			return;
		}
		
		// Proceed with validation
		isValidating = true;
		await validateAuthKey(authKey);
		isValidating = false;
	}
	
	async function validateAuthKey(key: string) {
		try {
			const res = await fetch(`https://viet_tri_api.mkt-viettri.workers.dev/api/auth/check`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `${key}`
				}
			});

			const resData = (await res.json()) as any;
			const isValid = resData.ok;
			
			if (!isValid) {
				isAuthenticated = false;
				goto('/auth');
			} else {
				isAuthenticated = true;
				lastValidated = Date.now();
			}
		} catch (error) {
			// Handle network errors gracefully
			console.error('Authentication validation error:', error);
			// Don't immediately redirect on network errors if previously authenticated
			if (!isAuthenticated) {
				goto('/auth');
			}
		}
	}
</script>

<div class="app-container">
	{#if isAuthenticated}
		<Sidebar />
	{/if}
	<main class={isAuthenticated ? 'with-sidebar' : 'no-sidebar'}>
		{@render children()}
	</main>
</div>

<style>
	.app-container {
		display: flex;
		width: 100%;
		min-height: 100vh;
	}
	
	main {
		flex: 1;
		padding: 16px;
		background-color: #f5f7f9;
		min-height: 100vh;
	}
	
	.with-sidebar {
		margin-left: 200px;
	}
	
	.no-sidebar {
		margin-left: 0;
	}
</style>
