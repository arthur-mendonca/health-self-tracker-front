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
			this.error = "Erro ao carregar tags.";
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
			this.error = "Erro ao criar tag.";
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
			this.error = "Erro ao atualizar tag.";
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
			this.error = "Erro ao remover tag.";
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
			this.error = "Erro ao carregar substâncias.";
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
			this.error = "Erro ao criar substância.";
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
			this.error = "Erro ao atualizar substância.";
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
			this.error = "Erro ao remover substância.";
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
			this.error = "Erro ao carregar atividades.";
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
			this.error = "Erro ao criar atividade.";
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
			this.error = "Erro ao atualizar atividade.";
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
			this.error = "Erro ao remover atividade.";
			console.error(err);
			throw err;
		}
	}

	// ===== INIT =====
	async loadAll() {
		this.error = null;
		await Promise.all([this.loadTags(), this.loadSubstances(), this.loadActivities()]);
	}
}
