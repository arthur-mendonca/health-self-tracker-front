import {
	fetchTags,
	fetchSubstances,
	fetchActivities,
	fetchTodayRecord,
	fetchRecordByDate,
	submitDailyRecord,
	exportDumpJSON,
} from "$lib/api/client";
import type { TagCategory, DropTime, SubstanceType, DailyRecordResponse } from "$lib/api/client";
import {
	formatDateDisplay,
	toISODateString,
	isSameDay,
	getYesterday,
	getTomorrow,
	tagCategoryColor,
} from "$lib/utils/helpers";

// ─── Local types ─────────────────────────────────────────────────────────

export interface TagItem {
	id?: string;
	name: string;
	category: TagCategory;
	[key: string]: unknown;
}

export interface SubstanceItem {
	name: string;
	type: SubstanceType;
	exactDose: string;
	notes?: string;
	effectDropTime?: DropTime;
	experiencedCrash: boolean;
}

export interface ActivityItem {
	id?: string;
	name: string;
	notes?: string;
	[key: string]: unknown;
}

export const TAG_CATEGORIES: { value: TagCategory; label: string }[] = [
	{ value: "SYMPTOM", label: "Sintoma" },
	{ value: "INTERFERENCE", label: "Interferência" },
	{ value: "TRIGGER", label: "Gatilho" },
	{ value: "RESCUE", label: "Resgate" },
	{ value: "GENERAL", label: "Geral" },
];

// ─── Store class ─────────────────────────────────────────────────────────

export class DailyLogStore {
	// Date navigation
	currentDate = $state(new Date());
	get dateDisplay() { return formatDateDisplay(this.currentDate); }
	get isToday() { return isSameDay(this.currentDate, new Date()); }
	get dateISO() { return toISODateString(this.currentDate); }

	goYesterday = () => { this.currentDate = getYesterday(this.currentDate); };
	goTomorrow = () => { this.currentDate = getTomorrow(this.currentDate); };
	goToday = () => { this.currentDate = new Date(); };

	// Metrics
	energy = $state<number | null>(null);
	sleepQuality = $state<number | null>(null);
	mood = $state<number | null>(null);
	focus = $state<number | null>(null);
	stress = $state<number | null>(null);

	// Tags
	selectedTags = $state<TagItem[]>([]);
	availableTags = $state<TagItem[]>([]);
	newTagCategory = $state<TagCategory>("GENERAL");

	handleTagCreate = (name: string) => {
		this.selectedTags = [...this.selectedTags, { name, category: this.newTagCategory }];
		this.newTagCategory = "GENERAL";
	};

	handleTagSelect = (item: { name: string; [key: string]: unknown }) => {
		const tag = item as unknown as TagItem;
		if (!this.selectedTags.some((t) => t.name === tag.name)) {
			this.selectedTags = [...this.selectedTags, tag];
		}
	};

	handleTagRemove = (item: { name: string; [key: string]: unknown }) => {
		this.selectedTags = this.selectedTags.filter((t) => t.name !== item.name);
	};

	getTagBadge = (item: { name: string; [key: string]: unknown }) => {
		const tag = item as unknown as TagItem;
		return { class: tagCategoryColor(tag.category || "GENERAL"), label: tag.name };
	};

	handleTagSearch = async (query: string) => {
		// Backend returns all tags, filter client-side
		const q = query.toLowerCase();
		if (!q) return;
		// Filter from cached available tags
		// (availableTags is already loaded from backend on init)
	};

	// Substances
	substances = $state<SubstanceItem[]>([]);
	availableSubstances = $state<{ id?: string; name: string; type: SubstanceType; defaultDose?: string | null }[]>([]);

	handleSubstanceSelect = (item: { name: string; [key: string]: unknown }) => {
		const sub = item as { name: string; type: SubstanceType; defaultDose?: string };
		if (!this.substances.some((s) => s.name === sub.name)) {
			this.substances = [
				...this.substances,
				{ name: sub.name, type: sub.type || "MEDICATION", exactDose: sub.defaultDose || "", experiencedCrash: false },
			];
		}
	};

	handleSubstanceCreate = (name: string) => {
		if (!this.substances.some((s) => s.name === name)) {
			this.substances = [
				...this.substances,
				{ name, type: "MEDICATION", exactDose: "", experiencedCrash: false },
			];
		}
	};

	removeSubstance = (index: number) => {
		this.substances = this.substances.filter((_, i) => i !== index);
	};

	handleSubstanceSearch = async (_query: string) => {
		// Substances are pre-loaded; filtering happens in the autocomplete component
	};

	// Activities
	selectedActivities = $state<ActivityItem[]>([]);
	availableActivities = $state<{ id?: string; name: string }[]>([]);

	handleActivityCreate = (name: string) => {
		if (!this.selectedActivities.some((a) => a.name === name)) {
			this.selectedActivities = [...this.selectedActivities, { name }];
		}
	};

	handleActivitySearch = async (_query: string) => {
		// Activities are pre-loaded; filtering happens in the autocomplete component
	};

	// Notes
	freeNotes = $state("");
	distractions = $state("");

	// Loading / Submit state
	isLoading = $state(false);
	isSubmitting = $state(false);
	submitMessage = $state<{ type: "success" | "error"; text: string } | null>(null);

	// ─── Reset form to empty state ──────────────────────────────────────
	resetForm() {
		this.energy = null;
		this.sleepQuality = null;
		this.mood = null;
		this.focus = null;
		this.stress = null;
		this.selectedTags = [];
		this.substances = [];
		this.selectedActivities = [];
		this.freeNotes = "";
		this.distractions = "";
		this.submitMessage = null;
	}

	// ─── Populate form from a DailyRecordResponse ───────────────────────
	loadFromResponse(record: DailyRecordResponse) {
		// Metrics
		const m = record.metrics as Record<string, number> | null;
		this.energy = m?.energy ?? null;
		this.sleepQuality = m?.sleepQuality ?? null;
		this.mood = m?.mood ?? null;
		this.focus = m?.focus ?? null;
		this.stress = m?.stress ?? null;

		// Tags
		this.selectedTags = record.tags.map((t) => ({
			id: t.id,
			name: t.name,
			category: t.category,
		}));

		// Substances — flatten from nested structure
		this.substances = record.substances.map((s) => ({
			name: s.substance.name,
			type: s.substance.type,
			exactDose: s.exactDose,
			notes: s.notes ?? undefined,
			effectDropTime: s.effectDropTime ?? undefined,
			experiencedCrash: s.experiencedCrash,
		}));

		// Activities — flatten from nested structure
		this.selectedActivities = record.activities.map((a) => ({
			id: a.activity.id,
			name: a.activity.name,
			notes: a.notes ?? undefined,
		}));

		// Structured notes
		const sn = record.structuredNotes as Record<string, string> | null;
		this.freeNotes = sn?.notes ?? "";
		this.distractions = sn?.distractions ?? "";
	}

	// ─── Fetch record for a specific date and populate ──────────────────
	async loadRecordForDate(date: string) {
		this.isLoading = true;
		try {
			const record = await fetchRecordByDate(date);
			if (record) {
				this.loadFromResponse(record);
			} else {
				this.resetForm();
			}
		} catch {
			this.resetForm();
		} finally {
			this.isLoading = false;
		}
	}

	// ─── Load all reference data + today's record (call from onMount) ───
	async loadInitialData() {
		this.isLoading = true;
		try {
			const [tags, subs, acts, todayRecord] = await Promise.all([
				fetchTags(),
				fetchSubstances(),
				fetchActivities(),
				fetchTodayRecord(),
			]);
			this.availableTags = tags as TagItem[];
			this.availableSubstances = subs;
			this.availableActivities = acts;

			if (todayRecord) {
				this.loadFromResponse(todayRecord);
			}
		} catch {
			// Backend unavailable — form stays empty
		} finally {
			this.isLoading = false;
		}
	}

	// ─── Submit ──────────────────────────────────────────────────────────
	async submit() {
		this.isSubmitting = true;
		this.submitMessage = null;

		const metrics: Record<string, number> = {};
		if (this.energy !== null) metrics.energy = this.energy;
		if (this.sleepQuality !== null) metrics.sleepQuality = this.sleepQuality;
		if (this.mood !== null) metrics.mood = this.mood;
		if (this.focus !== null) metrics.focus = this.focus;
		if (this.stress !== null) metrics.stress = this.stress;

		const payload = {
			date: this.dateISO,
			metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
			structuredNotes: {
				...(this.freeNotes ? { notes: this.freeNotes } : {}),
				...(this.distractions ? { distractions: this.distractions } : {}),
			},
			tags: this.selectedTags.map((t) => ({ name: t.name, category: t.category })),
			substances: this.substances.map((s) => ({
				name: s.name,
				type: s.type,
				exactDose: s.exactDose,
				notes: s.notes,
				effectDropTime: s.effectDropTime,
				experiencedCrash: s.experiencedCrash,
			})),
			activities: this.selectedActivities.map((a) => ({
				name: a.name,
				notes: a.notes as string | undefined,
			})),
		};

		try {
			await submitDailyRecord(payload);
			this.submitMessage = { type: "success", text: "✓ Registro salvo com sucesso" };
		} catch (err) {
			console.error("Submit error:", err);
			this.submitMessage = { type: "error", text: "Erro ao salvar. Verifique a conexão com a API." };
		} finally {
			this.isSubmitting = false;
			setTimeout(() => { this.submitMessage = null; }, 4000);
		}
	}

	// ─── Export dump ─────────────────────────────────────────────────────
	async downloadDump(dateISO: string) {
		try {
			const data = await exportDumpJSON();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `health-dump-${dateISO}.json`;
			a.click();
			URL.revokeObjectURL(url);
		} catch { /* silently fail */ }
	}
}
