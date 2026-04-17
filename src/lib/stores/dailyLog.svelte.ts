import {
  fetchTags,
  fetchSubstances,
  fetchActivities,
  fetchTodayRecord,
  fetchRecordByDate,
  submitDailyRecord,
} from "$lib/api/client";
import type {
  TagCategory,
  DropTime,
  SubstanceType,
  DailyRecordResponse,
} from "$lib/api/client";
import {
  formatDateDisplay,
  toISODateString,
  isSameDay,
  getYesterday,
  getTomorrow,
  tagCategoryColor,
} from "$lib/utils/helpers";

// ─── Helpers para Notação YAML-Like ──────────────────────────────────────

function parseYamlLike(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim() || !line.includes(":")) continue;
    const splitIdx = line.indexOf(":");
    const keyPart = line.slice(0, splitIdx).trim();
    const value = line.slice(splitIdx + 1).trim();
    if (!keyPart) continue;

    const keys = keyPart.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (
        !current[k] ||
        typeof current[k] !== "object" ||
        Array.isArray(current[k])
      ) {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];

    if (value === "true") current[lastKey] = true;
    else if (value === "false") current[lastKey] = false;
    else if (!isNaN(Number(value)) && value !== "")
      current[lastKey] = Number(value);
    else current[lastKey] = value;
  }

  return result;
}

function stringifyYamlLike(obj: Record<string, unknown>, prefix = ""): string {
  let result = "";
  for (const [key, value] of Object.entries(obj)) {
    let currentPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result += stringifyYamlLike(
        value as Record<string, unknown>,
        currentPrefix,
      );
    } else {
      result += `${currentPrefix}: ${value}\n`;
    }
  }
  return result;
}

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
  get dateDisplay() {
    return formatDateDisplay(this.currentDate);
  }
  get isToday() {
    return isSameDay(this.currentDate, new Date());
  }
  get dateISO() {
    return toISODateString(this.currentDate);
  }

  goYesterday = () => {
    this.currentDate = getYesterday(this.currentDate);
  };
  goTomorrow = () => {
    this.currentDate = getTomorrow(this.currentDate);
  };
  goToday = () => {
    this.currentDate = new Date();
  };

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
    this.selectedTags = [
      ...this.selectedTags,
      { name, category: this.newTagCategory },
    ];
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
    return {
      class: tagCategoryColor(tag.category || "GENERAL"),
      label: tag.name,
    };
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
  availableSubstances = $state<
    {
      id?: string;
      name: string;
      type: SubstanceType;
      defaultDose?: string | null;
    }[]
  >([]);

  handleSubstanceSelect = (item: { name: string; [key: string]: unknown }) => {
    const sub = item as {
      name: string;
      type: SubstanceType;
      defaultDose?: string;
    };
    if (!this.substances.some((s) => s.name === sub.name)) {
      this.substances = [
        ...this.substances,
        {
          name: sub.name,
          type: sub.type || "MEDICATION",
          exactDose: sub.defaultDose || "",
          experiencedCrash: false,
        },
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
  structuredYaml = $state("");

  // Loading / Submit state
  isLoading = $state(false);
  isSubmitting = $state(false);
  submitMessage = $state<{ type: "success" | "error"; text: string } | null>(
    null,
  );

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
    this.structuredYaml = "";
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
    const sn = record.structuredNotes as Record<string, unknown> | null;
    if (sn) {
      this.freeNotes = (sn.notes as string) ?? "";
      this.distractions = (sn.distractions as string) ?? "";

      const rest = { ...sn };
      delete rest.notes;
      delete rest.distractions;
      this.structuredYaml = stringifyYamlLike(rest).trim();
    } else {
      this.freeNotes = "";
      this.distractions = "";
      this.structuredYaml = "";
    }
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
    } catch (error) {
      console.error("Load record error:", error);
      this.submitMessage = {
        type: "error",
        text: formatStoreError("Erro ao carregar o registro", error),
      };
    } finally {
      this.isLoading = false;
    }
  }

  // ─── Load all reference data + today's record (call from onMount) ───
  async loadInitialData() {
    this.isLoading = true;
    try {
      const [tags, subs, acts, todayRecord] = await Promise.allSettled([
        fetchTags(),
        fetchSubstances(),
        fetchActivities(),
        fetchTodayRecord(),
      ]);

      const failures: string[] = [];

      if (tags.status === "fulfilled") {
        this.availableTags = tags.value as TagItem[];
      } else {
        failures.push(formatStoreError("tags", tags.reason));
      }

      if (subs.status === "fulfilled") {
        this.availableSubstances = subs.value;
      } else {
        failures.push(formatStoreError("substâncias", subs.reason));
      }

      if (acts.status === "fulfilled") {
        this.availableActivities = acts.value;
      } else {
        failures.push(formatStoreError("atividades", acts.reason));
      }

      if (todayRecord.status === "fulfilled") {
        if (todayRecord.value) {
          this.loadFromResponse(todayRecord.value);
        }
      } else {
        failures.push(formatStoreError("registro do dia", todayRecord.reason));
      }

      if (failures.length > 0) {
        this.submitMessage = {
          type: "error",
          text: `Alguns dados não foram carregados: ${failures.join(" | ")}`,
        };
      }
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

    const parsedYaml = parseYamlLike(this.structuredYaml);

    const payload = {
      date: this.dateISO,
      metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      structuredNotes: {
        ...parsedYaml,
        ...(this.freeNotes ? { notes: this.freeNotes } : {}),
        ...(this.distractions ? { distractions: this.distractions } : {}),
      },
      tags: this.selectedTags.map((t) => ({
        name: t.name,
        category: t.category,
      })),
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
      this.submitMessage = {
        type: "success",
        text: "✓ Registro salvo com sucesso",
      };
    } catch (err) {
      console.error("Submit error:", err);
      this.submitMessage = {
        type: "error",
        text: formatStoreError("Erro ao salvar", err),
      };
    } finally {
      this.isSubmitting = false;
      setTimeout(() => {
        this.submitMessage = null;
      }, 4000);
    }
  }

}

function formatStoreError(prefix: string, error: unknown): string {
  if (error instanceof Error) {
    return `${prefix}: ${error.message}`;
  }

  return prefix;
}
