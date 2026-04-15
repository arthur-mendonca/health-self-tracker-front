<script lang="ts">
	import { onMount } from "svelte";
	import { ChevronLeft, ChevronRight, Calendar, Send, Download } from "@lucide/svelte";
	import { DailyLogStore, TAG_CATEGORIES } from "$lib/stores/dailyLog.svelte";
	import CreatableAutocomplete from "$lib/components/CreatableAutocomplete.svelte";
	import MetricSelector from "$lib/components/MetricSelector.svelte";
	import SubstanceEntry from "$lib/components/SubstanceEntry.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	const log = new DailyLogStore();

	onMount(() => log.loadInitialData());
</script>

<svelte:head>
	<title>Log Diário — {log.dateDisplay}</title>
</svelte:head>

<form
	data-daily-form
	onsubmit={(e) => { e.preventDefault(); log.submit(); }}
	class="space-y-6"
>

	<!-- ─── HEADER ─────────────────────────────────────────────────── -->
	<header class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon-sm" onclick={log.goYesterday} aria-label="Dia anterior">
				<ChevronLeft class="size-4" />
			</Button>

			<div class="text-center">
				<h1 class="font-mono text-lg font-semibold tracking-tight text-foreground">
					{log.dateDisplay}
				</h1>
				{#if log.isToday}
					<span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">hoje</span>
				{/if}
			</div>

			<Button variant="ghost" size="icon-sm" onclick={log.goTomorrow} aria-label="Próximo dia">
				<ChevronRight class="size-4" />
			</Button>
		</div>

		{#if !log.isToday}
			<Button variant="ghost" size="sm" onclick={log.goToday}>
				<Calendar class="size-3.5" />
				Hoje
			</Button>
		{/if}
	</header>

	<Separator />

	<!-- ─── VITALS ─────────────────────────────────────────────────── -->
	<section aria-label="Métricas Base">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Vitals</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
			<MetricSelector label="Energia"  bind:value={log.energy}       id="metric-energy" />
			<MetricSelector label="Sono"     bind:value={log.sleepQuality} id="metric-sleep" />
			<MetricSelector label="Humor"    bind:value={log.mood}         id="metric-mood" />
			<MetricSelector label="Foco"     bind:value={log.focus}        id="metric-focus" />
			<MetricSelector label="Estresse" bind:value={log.stress}       id="metric-stress" />
		</div>
	</section>

	<Separator />

	<!-- ─── TAGS / OMNIBAR ─────────────────────────────────────────── -->
	<section aria-label="Tags">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-medium uppercase tracking-widest text-muted-foreground">Tags</h2>
			<div class="flex items-center gap-2">
				<label for="tag-category" class="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria:</label>
				<select
					id="tag-category"
					bind:value={log.newTagCategory}
					class="rounded-md border border-input bg-transparent px-2 py-0.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
				>
					{#each TAG_CATEGORIES as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<div id="omnibar-input">
			<CreatableAutocomplete
				placeholder="Buscar ou criar tag... (pressione /)"
				items={log.availableTags}
				bind:selected={log.selectedTags}
				onselect={log.handleTagSelect}
				onremove={log.handleTagRemove}
				oncreate={log.handleTagCreate}
				onsearch={log.handleTagSearch}
				renderBadge={log.getTagBadge}
				id="omnibar"
			/>
		</div>
		<p class="mt-1.5 text-[10px] text-muted-foreground">
			Pressione <kbd class="rounded border border-border px-1 py-0.5 font-mono text-[9px]">/</kbd> para focar ·
			<kbd class="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Enter</kbd> para adicionar ·
			<kbd class="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Backspace</kbd> para remover
		</p>
	</section>

	<Separator />

	<!-- ─── SUBSTÂNCIAS ─────────────────────────────────────────────── -->
	<section aria-label="Substâncias">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Substâncias</h2>

		<CreatableAutocomplete
			placeholder="Buscar ou criar substância..."
			items={log.availableSubstances}
			selected={[]}
			onselect={log.handleSubstanceSelect}
			oncreate={log.handleSubstanceCreate}
			onsearch={log.handleSubstanceSearch}
			id="substance-search"
		/>

		{#if log.substances.length > 0}
			<div class="mt-3 space-y-2">
				{#each log.substances as _, i (log.substances[i].name)}
					<SubstanceEntry
						bind:substance={log.substances[i]}
						onremove={() => log.removeSubstance(i)}
					/>
				{/each}
			</div>
		{/if}
	</section>

	<Separator />

	<!-- ─── ATIVIDADES ──────────────────────────────────────────────── -->
	<section aria-label="Atividades">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Atividades</h2>
		<CreatableAutocomplete
			placeholder="Buscar ou criar atividade..."
			items={log.availableActivities}
			bind:selected={log.selectedActivities}
			oncreate={log.handleActivityCreate}
			onsearch={log.handleActivitySearch}
			renderBadge={(item) => ({ class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: item.name })}
			id="activity-search"
		/>
	</section>

	<Separator />

	<!-- ─── ANOTAÇÕES ───────────────────────────────────────────────── -->
	<section aria-label="Anotações">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Anotações</h2>
		<div class="space-y-4">
			<div>
				<label for="notes-free" class="mb-1 block text-xs text-muted-foreground">Notas livres</label>
				<textarea
					id="notes-free"
					bind:value={log.freeNotes}
					placeholder="Como foi o dia? Observações relevantes..."
					rows={3}
					class="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				></textarea>
			</div>
			<div>
				<label for="notes-distractions" class="mb-1 block text-xs text-muted-foreground">Distrações / Interferências</label>
				<textarea
					id="notes-distractions"
					bind:value={log.distractions}
					placeholder="O que atrapalhou o foco hoje?"
					rows={2}
					class="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				></textarea>
			</div>
		</div>
	</section>

	<Separator />

	<!-- ─── FOOTER ──────────────────────────────────────────────────── -->
	<footer class="flex items-center justify-between">
		<div>
			{#if log.submitMessage}
				<span class="font-mono text-sm {log.submitMessage.type === 'success' ? 'text-emerald-400' : 'text-destructive'}">
					{log.submitMessage.text}
				</span>
			{:else}
				<span class="text-[10px] text-muted-foreground">
					<kbd class="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd>
					para salvar
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" type="button" onclick={() => log.downloadDump(log.dateISO)}>
				<Download class="size-3.5" />
				Dump
			</Button>
			<Button type="submit" disabled={log.isSubmitting} size="sm">
				<Send class="size-3.5" />
				{log.isSubmitting ? "Salvando..." : "Salvar Log"}
			</Button>
		</div>
	</footer>
</form>
