import type { SchemaDocument } from '../types/schema';

const STORAGE_KEY = 'schema-maker-online:draft';
const STORAGE_VERSION = 1;

interface StoredDraft {
  version: number;
  savedAt: string;
  doc: SchemaDocument;
}

export function saveDraft(doc: SchemaDocument): void {
  try {
    const payload: StoredDraft = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      doc,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded or private mode — ignore */
  }
}

export function loadDraft(): SchemaDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed?.version !== STORAGE_VERSION || !parsed.doc?.elements) return null;
    return parsed.doc;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
