/**
 * Mock data for frontend-only testing (no backend required).
 * Simulates realistic data that would come from the NestJS API.
 */

import type { TagCategory, SubstanceType, DailyRecordResponse } from "./client";

export const MOCK_TAGS: { id: string; name: string; category: TagCategory }[] = [
	{ id: "01", name: "Dor de cabeça", category: "SYMPTOM" },
	{ id: "02", name: "Fadiga", category: "SYMPTOM" },
	{ id: "03", name: "Ansiedade", category: "SYMPTOM" },
	{ id: "04", name: "Insônia", category: "SYMPTOM" },
	{ id: "05", name: "Reunião estressante", category: "TRIGGER" },
	{ id: "06", name: "Falta de sono", category: "TRIGGER" },
	{ id: "07", name: "Cafeína em excesso", category: "TRIGGER" },
	{ id: "08", name: "Trabalho remoto", category: "INTERFERENCE" },
	{ id: "09", name: "Ruído externo", category: "INTERFERENCE" },
	{ id: "10", name: "Meditação", category: "RESCUE" },
	{ id: "11", name: "Caminhada curta", category: "RESCUE" },
	{ id: "12", name: "Respiração", category: "RESCUE" },
	{ id: "13", name: "Produtivo", category: "GENERAL" },
	{ id: "14", name: "Home office", category: "GENERAL" },
];

export const MOCK_SUBSTANCES: { id: string; name: string; type: SubstanceType; defaultDose?: string }[] = [
	{ id: "s01", name: "Ritalina", type: "MEDICATION", defaultDose: "10mg" },
	{ id: "s02", name: "Venvanse", type: "MEDICATION", defaultDose: "50mg" },
	{ id: "s03", name: "Clonazepam", type: "MEDICATION", defaultDose: "0.5mg" },
	{ id: "s04", name: "Sertralina", type: "MEDICATION", defaultDose: "50mg" },
	{ id: "s05", name: "Melatonina", type: "SUPPLEMENT", defaultDose: "3mg" },
	{ id: "s06", name: "Magnésio", type: "SUPPLEMENT", defaultDose: "300mg" },
	{ id: "s07", name: "Vitamina D", type: "SUPPLEMENT", defaultDose: "2000UI" },
	{ id: "s08", name: "Ômega 3", type: "SUPPLEMENT", defaultDose: "1g" },
	{ id: "s09", name: "Cafeína", type: "SUPPLEMENT", defaultDose: "100mg" },
];

export const MOCK_ACTIVITIES: { id: string; name: string }[] = [
	{ id: "a01", name: "Corrida" },
	{ id: "a02", name: "Musculação" },
	{ id: "a03", name: "Caminhada" },
	{ id: "a04", name: "Ciclismo" },
	{ id: "a05", name: "Yoga" },
	{ id: "a06", name: "Natação" },
	{ id: "a07", name: "Alongamento" },
];

export const MOCK_TODAY_RECORD: DailyRecordResponse = {
	id: "mock-record-01",
	date: new Date().toISOString(),
	metrics: { energy: 3, sleepQuality: 2, mood: 4, focus: 3, stress: 2 },
	structuredNotes: {
		notes: "Dia ok, reunião longa de manhã.",
		distractions: "Notificações do celular.",
	},
	tags: [
		{ id: "01", name: "Fadiga", category: "SYMPTOM" },
		{ id: "08", name: "Trabalho remoto", category: "INTERFERENCE" },
	],
	substances: [
		{
			id: "ds01",
			substanceId: "s01",
			substance: { id: "s01", name: "Ritalina", type: "MEDICATION" },
			exactDose: "10mg",
			effectDropTime: "AFTERNOON",
			experiencedCrash: false,
		},
	],
	activities: [
		{
			id: "da01",
			activityId: "a03",
			activity: { id: "a03", name: "Caminhada" },
		},
	],
};
