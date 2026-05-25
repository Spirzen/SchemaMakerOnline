const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const NAMED_COLORS = new Set(['transparent']);

/** Safe filename for downloads — no path traversal or special chars. */
export function sanitizeFilename(name: string, fallback = 'schema'): string {
  const trimmed = name.trim().slice(0, 80);
  const safe = trimmed.replace(/[^\w\u0400-\u04FF\s-]/gi, '').trim();
  return safe || fallback;
}

export function sanitizeDocName(name: string): string {
  return name.trim().slice(0, 120) || 'Без названия';
}

export function isSafeColor(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (NAMED_COLORS.has(value)) return true;
  return HEX_COLOR.test(value);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export const LIMITS = {
  maxImportBytes: 2 * 1024 * 1024,
  maxElements: 500,
  maxTextLength: 4000,
  maxPoints: 8000,
  maxDocNameLength: 120,
} as const;
