import {
	fetchTags,
	createTag,
	updateTag,
	deleteTag,
	fetchSubstances,
	createSubstance,
	updateSubstance,
	deleteSubstance,
	fetchActivities,
	createActivity,
	updateActivity,
	deleteActivity,
} from "$lib/api/client";
import type { TagResponse, SubstanceResponse, ActivityResponse, TagCategory, SubstanceType } from "$lib/api/client";
import { tagCategoryColor } from "$lib/utils/helpers";

export class ManageStore {
	activeTab = $state<"tags" | "substances" | "activities">("tags");

	// --- Tags ---
	tags = $state<TagResponse[]>([]);
	isTagsLoading = $state(false);

	// --- Substances ---
	substances = $state<SubstanceResponse[]>([]);
	isSubstancesLoading = $state(false);

	// --- Activities ---
	activities = $state<ActivityResponse[]>([]);
	isActivitiesLoading = $state(false);

	// --- General ---
	error = $state<string | null>(null);

	// ===== TAGS =====
	async loadTags() {
		this.isTagsLoading = true;
		try {
			this.tags = await fetchTags();
		} catch (err) {
			this.error = formatStoreError("Erro ao carregar tags", err);
			console.error(err);
		} finally {
			this.isTagsLoading = false;
		}
	}

	async createNewTag(name: string, category: TagCategory) {
		this.error = null;
		try {
			const tag = await createTag({ name, category });
			// The backend handles upsert by name, so instead of just appending, let's reload to keep sorted
			await this.loadTags();
			return tag;
		} catch (err) {
			this.error = formatStoreError("Erro ao criar tag", err);
			console.error(err);
			throw err;
		}
	}

	async updateExistingTag(id: string, payload: { name?: string; category?: TagCategory }) {
		this.error = null;
		try {
			await updateTag(id, payload);
			await this.loadTags();
		} catch (err) {
			this.error = formatStoreError("Erro ao atualizar tag", err);
			console.error(err);
			throw err;
		}
	}

	async deleteExistingTag(id: string) {
		this.error = null;
		try {
			await deleteTag(id);
			this.tags = this.tags.filter((t) => t.id !== id);
		} catch (err) {
			this.error = formatStoreError("Erro ao remover tag", err);
			console.error(err);
			throw err;
		}
	}

	getTagColor(category: TagCategory) {
		return tagCategoryColor(category);
	}

	// ===== SUBSTANCES =====
	async loadSubstances() {
		this.isSubstancesLoading = true;
		try {
			this.substances = await fetchSubstances();
		} catch (err) {
			this.error = formatStoreError("Erro ao carregar substâncias", err);
			console.error(err);
		} finally {
			this.isSubstancesLoading = false;
		}
	}

	async createNewSubstance(name: string, type: SubstanceType, defaultDose?: string | null) {
		this.error = null;
		try {
			const substance = await createSubstance({ name, type, defaultDose });
			await this.loadSubstances();
			return substance;
		} catch (err) {
			this.error = formatStoreError("Erro ao criar substância", err);
			console.error(err);
			throw err;
		}
	}

	async updateExistingSubstance(id: string, payload: { name?: string; type?: SubstanceType; defaultDose?: string | null }) {
		this.error = null;
		try {
			await updateSubstance(id, payload);
			await this.loadSubstances();
		} catch (err) {
			this.error = formatStoreError("Erro ao atualizar substância", err);
			console.error(err);
			throw err;
		}
	}

	async deleteExistingSubstance(id: string) {
		this.error = null;
		try {
			await deleteSubstance(id);
			this.substances = this.substances.filter((s) => s.id !== id);
		} catch (err) {
			this.error = formatStoreError("Erro ao remover substância", err);
			console.error(err);
			throw err;
		}
	}

	// ===== ACTIVITIES =====
	async loadActivities() {
		this.isActivitiesLoading = true;
		try {
			this.activities = await fetchActivities();
		} catch (err) {
			this.error = formatStoreError("Erro ao carregar atividades", err);
			console.error(err);
		} finally {
			this.isActivitiesLoading = false;
		}
	}

	async createNewActivity(name: string) {
		this.error = null;
		try {
			const activity = await createActivity({ name });
			await this.loadActivities();
			return activity;
		} catch (err) {
			this.error = formatStoreError("Erro ao criar atividade", err);
			console.error(err);
			throw err;
		}
	}

	async updateExistingActivity(id: string, payload: { name?: string }) {
		this.error = null;
		try {
			await updateActivity(id, payload);
			await this.loadActivities();
		} catch (err) {
			this.error = formatStoreError("Erro ao atualizar atividade", err);
			console.error(err);
			throw err;
		}
	}

	async deleteExistingActivity(id: string) {
		this.error = null;
		try {
			await deleteActivity(id);
			this.activities = this.activities.filter((a) => a.id !== id);
		} catch (err) {
			this.error = formatStoreError("Erro ao remover atividade", err);
			console.error(err);
			throw err;
		}
	}

	// ===== INIT =====
	async loadAll() {
		this.error = null;
		this.isTagsLoading = true;
		this.isSubstancesLoading = true;
		this.isActivitiesLoading = true;

		const [tags, substances, activities] = await Promise.allSettled([
			fetchTags(),
			fetchSubstances(),
			fetchActivities(),
		]);
		const failures: string[] = [];

		if (tags.status === "fulfilled") {
			this.tags = tags.value;
		} else {
			failures.push(formatStoreError("tags", tags.reason));
			console.error(tags.reason);
		}

		if (substances.status === "fulfilled") {
			this.substances = substances.value;
		} else {
			failures.push(formatStoreError("substâncias", substances.reason));
			console.error(substances.reason);
		}

		if (activities.status === "fulfilled") {
			this.activities = activities.value;
		} else {
			failures.push(formatStoreError("atividades", activities.reason));
			console.error(activities.reason);
		}

		this.isTagsLoading = false;
		this.isSubstancesLoading = false;
		this.isActivitiesLoading = false;
		this.error = failures.length > 0
			? `Alguns dados não foram carregados: ${failures.join(" | ")}`
			: null;
	}
}

function formatStoreError(prefix: string, error: unknown): string {
	if (error instanceof Error) {
		return `${prefix}: ${error.message}`;
	}

	return prefix;
}
