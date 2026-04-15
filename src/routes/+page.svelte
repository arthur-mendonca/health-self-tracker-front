<script lang="ts">
	import { ChevronLeft, ChevronRight, Calendar, Send, Download } from "@lucide/svelte";
	import CreatableAutocomplete from "$lib/components/CreatableAutocomplete.svelte";
	import MetricSelector from "$lib/components/MetricSelector.svelte";
	import SubstanceEntry from "$lib/components/SubstanceEntry.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import {
		formatDateDisplay,
		toISODateString,
		isSameDay,
		getYesterday,
		getTomorrow,
		tagCategoryColor,
		tagCategoryLabel,
	} from "$lib/utils/helpers";
	import type { TagCategory, DropTime, SubstanceType } from "$lib/api/client";

	// ─── State ────────────────────────────────────────────────────────
	let currentDate = $state(new Date());
	let isSubmitting = $state(false);
	let submitMessage = $state<{ type: "success" | "error"; text: string } | null>(null);

	// Metrics
	let energy = $state<number | null>(null);
	let sleepQuality = $state<number | null>(null);
	let mood = $state<number | null>(null);
	let focus = $state<number | null>(null);
	let stress = $state<number | null>(null);

	// Tags
	interface TagItem {
		id?: string;
		name: string;
		category: TagCategory;
		[key: string]: unknown;
	}
	let selectedTags = $state<TagItem[]>([]);
	let availableTags = $state<TagItem[]>([]);

	// Substances
	interface SubstanceItem {
		name: string;
		type: SubstanceType;
		exactDose: string;
		notes?: string;
		effectDropTime?: DropTime;
		experiencedCrash: boolean;
	}
	let substances = $state<SubstanceItem[]>([]);
	let availableSubstances = $state<{ id?: string; name: string; type: SubstanceType; defaultDose?: string }[]>([]);

	// Activities
	interface ActivityItem {
		id?: string;
		name: string;
		notes?: string;
		[key: string]: unknown;
	}
	let selectedActivities = $state<ActivityItem[]>([]);
	let availableActivities = $state<{ id?: string; name: string }[]>([]);

	// Notes
	let freeNotes = $state("");
	let distractions = $state("");

	// ─── Derived ──────────────────────────────────────────────────────
	let dateDisplay = $derived(formatDateDisplay(currentDate));
	let isToday = $derived(isSameDay(currentDate, new Date()));
	let dateISO = $derived(toISODateString(currentDate));

	// ─── Navigation ──────────────────────────────────────────────────
	function goYesterday() {
		currentDate = getYesterday(currentDate);
	}
	function goTomorrow() {
		currentDate = getTomorrow(currentDate);
	}
	function goToday() {
		currentDate = new Date();
	}

	// ─── Tag category helper ─────────────────────────────────────────
	const categoryOptions: { value: TagCategory; label: string }[] = [
		{ value: "SYMPTOM", label: "Sintoma" },
		{ value: "INTERFERENCE", label: "Interferência" },
		{ value: "TRIGGER", label: "Gatilho" },
		{ value: "RESCUE", label: "Resgate" },
		{ value: "GENERAL", label: "Geral" },
	];

	let newTagCategory = $state<TagCategory>("GENERAL");

	function handleTagCreate(name: string) {
		const newTag: TagItem = { name, category: newTagCategory };
		selectedTags = [...selectedTags, newTag];
		// Reset category to GENERAL after creation
		newTagCategory = "GENERAL";
	}

	function handleTagSelect(item: { name: string; [key: string]: unknown }) {
		const tag = item as unknown as TagItem;
		if (!selectedTags.some((t) => t.name === tag.name)) {
			selectedTags = [...selectedTags, tag];
		}
	}

	function handleTagRemove(item: { name: string; [key: string]: unknown }) {
		selectedTags = selectedTags.filter((t) => t.name !== item.name);
	}

	function getTagBadge(item: { name: string; [key: string]: unknown }) {
		const tag = item as unknown as TagItem;
		return {
			class: tagCategoryColor(tag.category || "GENERAL"),
			label: tag.name,
		};
	}

	// ─── Substance helpers ──────────────────────────────────────────
	function handleSubstanceSelect(item: { name: string; [key: string]: unknown }) {
		const sub = item as { name: string; type: SubstanceType; defaultDose?: string };
		if (!substances.some((s) => s.name === sub.name)) {
			substances = [
				...substances,
				{
					name: sub.name,
					type: sub.type || "MEDICATION",
					exactDose: sub.defaultDose || "",
					experiencedCrash: false,
				},
			];
		}
	}

	function handleSubstanceCreate(name: string) {
		if (!substances.some((s) => s.name === name)) {
			substances = [
				...substances,
				{
					name,
					type: "MEDICATION",
					exactDose: "",
					experiencedCrash: false,
				},
			];
		}
	}

	function removeSubstance(index: number) {
		substances = substances.filter((_, i) => i !== index);
	}

	// ─── Activity helpers ───────────────────────────────────────────
	function handleActivityCreate(name: string) {
		if (!selectedActivities.some((a) => a.name === name)) {
			selectedActivities = [...selectedActivities, { name }];
		}
	}

	// ─── Submit ─────────────────────────────────────────────────────
	async function handleSubmit() {
		isSubmitting = true;
		submitMessage = null;

		const metrics: Record<string, number> = {};
		if (energy !== null) metrics.energy = energy;
		if (sleepQuality !== null) metrics.sleepQuality = sleepQuality;
		if (mood !== null) metrics.mood = mood;
		if (focus !== null) metrics.focus = focus;
		if (stress !== null) metrics.stress = stress;

		const payload = {
			date: dateISO,
			metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
			structuredNotes: {
				...(freeNotes ? { notes: freeNotes } : {}),
				...(distractions ? { distractions } : {}),
			},
			tags: selectedTags.map((t) => ({ name: t.name, category: t.category })),
			substances: substances.map((s) => ({
				name: s.name,
				type: s.type,
				exactDose: s.exactDose,
				notes: s.notes,
				effectDropTime: s.effectDropTime,
				experiencedCrash: s.experiencedCrash,
			})),
			activities: selectedActivities.map((a) => ({
				name: a.name,
				notes: a.notes,
			})),
		};

		try {
			const { submitDailyRecord } = await import("$lib/api/client");
			await submitDailyRecord(payload);
			submitMessage = { type: "success", text: "✓ Registro salvo com sucesso" };
		} catch (err) {
			console.error("Submit error:", err);
			submitMessage = { type: "error", text: "Erro ao salvar registro. Verifique a conexão com a API." };
		} finally {
			isSubmitting = false;
			setTimeout(() => {
				submitMessage = null;
			}, 4000);
		}
	}
</script>

<svelte:head>
	<title>Log Diário — {dateDisplay}</title>
</svelte:head>

<!-- ─── MAIN FORM ──────────────────────────────────────────────────── -->
<form data-daily-form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">

	<!-- ─── HEADER CRONOLÓGICO ─────────────────────────────────────── -->
	<header class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="icon-sm" onclick={goYesterday} aria-label="Dia anterior">
				<ChevronLeft class="size-4" />
			</Button>

			<div class="text-center">
				<h1 class="font-mono text-lg font-semibold text-foreground tracking-tight">
					{dateDisplay}
				</h1>
				{#if isToday}
					<span class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
						hoje
					</span>
				{/if}
			</div>

			<Button variant="ghost" size="icon-sm" onclick={goTomorrow} aria-label="Próximo dia">
				<ChevronRight class="size-4" />
			</Button>
		</div>

		{#if !isToday}
			<Button variant="ghost" size="sm" onclick={goToday}>
				<Calendar class="size-3.5" />
				Hoje
			</Button>
		{/if}
	</header>

	<Separator />

	<!-- ─── SECTION: VITALS (MÉTRICAS) ─────────────────────────────── -->
	<section aria-label="Métricas Base">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
			Vitals
		</h2>
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
			<MetricSelector label="Energia" bind:value={energy} id="metric-energy" />
			<MetricSelector label="Sono" bind:value={sleepQuality} id="metric-sleep" />
			<MetricSelector label="Humor" bind:value={mood} id="metric-mood" />
			<MetricSelector label="Foco" bind:value={focus} id="metric-focus" />
			<MetricSelector label="Estresse" bind:value={stress} id="metric-stress" />
		</div>
	</section>

	<Separator />

	<!-- ─── SECTION: OMNIBAR (TAGS) ─────────────────────────────────── -->
	<section aria-label="Tags">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-xs font-medium uppercase tracking-widest text-muted-foreground">
				Tags
			</h2>
			<div class="flex items-center gap-2">
				<label for="tag-category" class="text-[10px] text-muted-foreground uppercase tracking-wider">
					Categoria:
				</label>
				<select
					id="tag-category"
					bind:value={newTagCategory}
					class="rounded-md border border-input bg-transparent px-2 py-0.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
				>
					{#each categoryOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<div id="omnibar-input">
			<CreatableAutocomplete
				placeholder="Buscar ou criar tag... (pressione /)"
				items={availableTags}
				bind:selected={selectedTags}
				onselect={handleTagSelect}
				onremove={handleTagRemove}
				oncreate={handleTagCreate}
				renderBadge={getTagBadge}
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

	<!-- ─── SECTION: SUBSTÂNCIAS ────────────────────────────────────── -->
	<section aria-label="Substâncias">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
			Substâncias
		</h2>

		<CreatableAutocomplete
			placeholder="Buscar ou criar substância..."
			items={availableSubstances}
			selected={[]}
			onselect={handleSubstanceSelect}
			oncreate={handleSubstanceCreate}
			id="substance-search"
		/>

		{#if substances.length > 0}
			<div class="mt-3 space-y-2">
				{#each substances as sub, i (sub.name)}
					<SubstanceEntry
						bind:substance={substances[i]}
						onremove={() => removeSubstance(i)}
					/>
				{/each}
			</div>
		{/if}
	</section>

	<Separator />

	<!-- ─── SECTION: ATIVIDADES ─────────────────────────────────────── -->
	<section aria-label="Atividades">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
			Atividades
		</h2>

		<CreatableAutocomplete
			placeholder="Buscar ou criar atividade..."
			items={availableActivities}
			bind:selected={selectedActivities}
			oncreate={handleActivityCreate}
			renderBadge={(item) => ({
				class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
				label: item.name,
			})}
			id="activity-search"
		/>
	</section>

	<Separator />

	<!-- ─── SECTION: NOTAS ─────────────────────────────────────────── -->
	<section aria-label="Notas">
		<h2 class="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
			Anotações
		</h2>

		<div class="space-y-4">
			<div>
				<label for="notes-free" class="mb-1 block text-xs text-muted-foreground">
					Notas livres
				</label>
				<textarea
					id="notes-free"
					bind:value={freeNotes}
					placeholder="Como foi o dia? Observações relevantes..."
					rows={3}
					class="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				></textarea>
			</div>

			<div>
				<label for="notes-distractions" class="mb-1 block text-xs text-muted-foreground">
					Distrações / Interferências
				</label>
				<textarea
					id="notes-distractions"
					bind:value={distractions}
					placeholder="O que atrapalhou o foco hoje?"
					rows={2}
					class="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				></textarea>
			</div>
		</div>
	</section>

	<Separator />

	<!-- ─── FOOTER: SUBMIT ─────────────────────────────────────────── -->
	<footer class="flex items-center justify-between">
		<div>
			{#if submitMessage}
				<span
					class="font-mono text-sm transition-all {submitMessage.type === 'success'
						? 'text-emerald-400'
						: 'text-destructive'}"
				>
					{submitMessage.text}
				</span>
			{:else}
				<span class="text-[10px] text-muted-foreground">
					<kbd class="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd>
					para salvar
				</span>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				type="button"
				onclick={async () => {
					try {
						const { exportDump } = await import("$lib/api/client");
						const data = await exportDump("json");
						const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
						const url = URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = `health-dump-${dateISO}.json`;
						a.click();
						URL.revokeObjectURL(url);
					} catch { /* silently fail if API is not available */ }
				}}
			>
				<Download class="size-3.5" />
				Dump
			</Button>

			<Button type="submit" disabled={isSubmitting} size="sm">
				<Send class="size-3.5" />
				{isSubmitting ? "Salvando..." : "Salvar Log"}
			</Button>
		</div>
	</footer>
</form>
