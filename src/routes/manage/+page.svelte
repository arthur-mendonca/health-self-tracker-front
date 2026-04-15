<script lang="ts">
	import { onMount, untrack } from "svelte";
	import { ManageStore } from "$lib/stores/manage.svelte";
	import { Loader2 } from "@lucide/svelte";
	import ManageTags from "$lib/components/ManageTags.svelte";
	import ManageSubstances from "$lib/components/ManageSubstances.svelte";
	import ManageActivities from "$lib/components/ManageActivities.svelte";

	const store = new ManageStore();

	onMount(() => {
		untrack(() => store.loadAll());
	});
</script>

<svelte:head>
	<title>Gerenciamento — Health Self Tracker</title>
</svelte:head>

<div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
	<header>
		<h1 class="text-xl font-semibold tracking-tight text-foreground" id="manage-title">Configurações Base</h1>
		<p class="text-sm text-muted-foreground mt-1">Gerencie seu banco de dados de propriedades diárias.</p>
	</header>

	{#if store.error}
		<div class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
			{store.error}
			<button class="ml-2 font-medium underline" onclick={() => store.error = null}>X</button>
		</div>
	{/if}

	<div class="flex items-center space-x-1 rounded-md bg-muted p-1 sm:max-w-md w-full" role="tablist" aria-labelledby="manage-title">
		<button
			role="tab"
			aria-selected={store.activeTab === "tags"}
			onclick={() => store.activeTab = "tags"}
			class="flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all {store.activeTab === 'tags' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			Tags
		</button>
		<button
			role="tab"
			aria-selected={store.activeTab === "substances"}
			onclick={() => store.activeTab = "substances"}
			class="flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all {store.activeTab === 'substances' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			Substâncias
		</button>
		<button
			role="tab"
			aria-selected={store.activeTab === "activities"}
			onclick={() => store.activeTab = "activities"}
			class="flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all {store.activeTab === 'activities' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
		>
			Atividades
		</button>
	</div>

	<div class="relative min-h-[400px]">
		{#if store.activeTab === "tags"}
			<section aria-label="Gerenciar Tags" class="fade-in animate-in duration-200">
				<ManageTags
					items={store.tags}
					isLoading={store.isTagsLoading}
					getColor={store.getTagColor}
					onCreate={async (name, category) => { await store.createNewTag(name, category); }}
					onUpdate={store.updateExistingTag.bind(store)}
					onDelete={store.deleteExistingTag.bind(store)}
				/>
			</section>
		{:else if store.activeTab === "substances"}
			<section aria-label="Gerenciar Substâncias" class="fade-in animate-in duration-200">
				<ManageSubstances
					items={store.substances}
					isLoading={store.isSubstancesLoading}
					onCreate={async (name, type, dose) => { await store.createNewSubstance(name, type, dose); }}
					onUpdate={store.updateExistingSubstance.bind(store)}
					onDelete={store.deleteExistingSubstance.bind(store)}
				/>
			</section>
		{:else if store.activeTab === "activities"}
			<section aria-label="Gerenciar Atividades" class="fade-in animate-in duration-200">
				<ManageActivities
					items={store.activities}
					isLoading={store.isActivitiesLoading}
					onCreate={async (name) => { await store.createNewActivity(name); }}
					onUpdate={(id, name) => store.updateExistingActivity(id, { name })}
					onDelete={store.deleteExistingActivity.bind(store)}
				/>
			</section>
		{/if}

		{#if store.isTagsLoading && store.isSubstancesLoading && store.isActivitiesLoading && !store.tags.length && !store.substances.length && !store.activities.length}
			<div class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-[1px]">
				<Loader2 class="size-6 animate-spin text-muted-foreground" />
			</div>
		{/if}
	</div>
</div>
