export interface Speech {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "voiceprompter_speeches";

function getSpeeches(): Speech[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSpeeches(speeches: Speech[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(speeches));
}

export function loadAllSpeeches(): Speech[] {
  return getSpeeches().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSpeech(speech: Omit<Speech, "id" | "createdAt" | "updatedAt">): Speech {
  const speeches = getSpeeches();
  const newSpeech: Speech = {
    ...speech,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  speeches.push(newSpeech);
  saveSpeeches(speeches);
  return newSpeech;
}

export function updateSpeech(id: string, updates: Partial<Pick<Speech, "title" | "text">>): Speech | null {
  const speeches = getSpeeches();
  const index = speeches.findIndex((s) => s.id === id);
  if (index === -1) return null;
  speeches[index] = { ...speeches[index], ...updates, updatedAt: Date.now() };
  saveSpeeches(speeches);
  return speeches[index];
}

export function deleteSpeech(id: string): boolean {
  const speeches = getSpeeches();
  const filtered = speeches.filter((s) => s.id !== id);
  if (filtered.length === speeches.length) return false;
  saveSpeeches(filtered);
  return true;
}
