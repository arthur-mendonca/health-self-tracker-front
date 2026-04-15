<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { LogOut, Settings, ArrowLeft } from '@lucide/svelte';

	let { children } = $props();

	// Auth guard: redirect to /login if not authenticated (except on /login itself)
	$effect(() => {
		if (!authStore.isAuthenticated && page.url.pathname !== '/login') {
			goto('/login', { replaceState: true });
		}
	});

	function handleLogout() {
		authStore.logout();
		goto('/login', { replaceState: true });
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		// Ctrl+Enter: submit form from anywhere
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			const form = document.querySelector('form[data-daily-form]') as HTMLFormElement | null;
			if (form) {
				e.preventDefault();
				form.requestSubmit();
			}
		}

		// "/": focus the Omnibar
		if (e.key === '/' && !isInputFocused()) {
			e.preventDefault();
			const omnibar = document.getElementById('omnibar-input');
			if (omnibar) {
				(omnibar as HTMLInputElement).focus();
			}
		}
	}

	function isInputFocused(): boolean {
		const el = document.activeElement;
		if (!el) return false;
		const tag = el.tagName.toLowerCase();
		return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
	<title>Health Self Tracker</title>
	<meta name="description" content="Registro diário pessoal de saúde — Fricção Zero" />
</svelte:head>

	<div class="dark min-h-screen bg-background text-foreground">
		<div class="mx-auto max-w-3xl px-4 py-6">
			{#if authStore.isAuthenticated && page.url.pathname !== '/login'}
				<div class="mb-4 flex items-center justify-end gap-2">
					{#if page.url.pathname === '/manage'}
						<button
							onclick={() => goto('/', { replaceState: true })}
							class="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
							aria-label="Voltar para Início"
						>
							<ArrowLeft class="size-3" />
							Voltar
						</button>
					{:else}
						<button
							onclick={() => goto('/manage')}
							class="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
							aria-label="Configurações"
						>
							<Settings class="size-3" />
							Configurações
						</button>
					{/if}
					
					<button
						onclick={handleLogout}
						class="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
						aria-label="Sair"
					>
					<LogOut class="size-3" />
					Sair
				</button>
			</div>
		{/if}
		{@render children()}
	</div>
</div>
