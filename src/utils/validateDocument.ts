import { v4 as uuid } from 'uuid';
import type { AnchorIndex, ElementType, SchemaDocument, SchemaElement, Viewport } from '../types/schema';
import { clampNumber, isSafeColor, LIMITS, sanitizeDocName } from './sanitize';

const ELEMENT_TYPES: ReadonlySet<ElementType> = new Set([
  'rectangle',
  'roundedRect',
  'circle',
  'diamond',
  'triangle',
  'line',
  'arrow',
  'connector',
  'pen',
  'text',
  'comment',
]);

function sanitizeText(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string') return undefined;
  return value.slice(0, LIMITS.maxTextLength);
}

function sanitizePoints(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const pts = value
    .slice(0, LIMITS.maxPoints)
    .map((v) => clampNumber(v, -50000, 50000, 0));
  return pts.length >= 2 ? pts : undefined;
}

function sanitizeAnchor(value: unknown): AnchorIndex | undefined {
  const n = clampNumber(value, 0, 7, -1);
  if (n < 0 || n > 7) return undefined;
  return n as AnchorIndex;
}

function sanitizeElement(raw: unknown): SchemaElement | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const type = o.type;
  if (typeof type !== 'string' || !ELEMENT_TYPES.has(type as ElementType)) return null;

  const fill = isSafeColor(o.fill) ? o.fill : '#e8ecf4';
  const stroke = isSafeColor(o.stroke) ? o.stroke : '#8b9dc3';

  const id =
    typeof o.id === 'string' && /^[\w-]{1,64}$/.test(o.id)
      ? o.id
      : uuid();

  const el: SchemaElement = {
    id,
    type: type as ElementType,
    x: clampNumber(o.x, -50000, 50000, 0),
    y: clampNumber(o.y, -50000, 50000, 0),
    fill,
    stroke,
    strokeWidth: clampNumber(o.strokeWidth, 0, 24, 2),
  };

  if (o.width != null) el.width = clampNumber(o.width, 1, 10000, 120);
  if (o.height != null) el.height = clampNumber(o.height, 1, 10000, 80);
  if (o.rotation != null) el.rotation = clampNumber(o.rotation, -3600, 3600, 0);
  if (o.opacity != null) el.opacity = clampNumber(o.opacity, 0, 1, 1);
  if (o.fontSize != null) el.fontSize = clampNumber(o.fontSize, 8, 72, 14);
  if (typeof o.fontStyle === 'string') el.fontStyle = o.fontStyle.slice(0, 32);
  if (o.cornerRadius != null) el.cornerRadius = clampNumber(o.cornerRadius, 0, 200, 0);

  const text = sanitizeText(o.text);
  if (text !== undefined) el.text = text;

  const points = sanitizePoints(o.points);
  if (points) el.points = points;

  if (typeof o.fromId === 'string' && /^[\w-]{1,64}$/.test(o.fromId)) el.fromId = o.fromId;
  if (typeof o.toId === 'string' && /^[\w-]{1,64}$/.test(o.toId)) el.toId = o.toId;

  const fromAnchor = sanitizeAnchor(o.fromAnchor);
  if (fromAnchor !== undefined) el.fromAnchor = fromAnchor;
  const toAnchor = sanitizeAnchor(o.toAnchor);
  if (toAnchor !== undefined) el.toAnchor = toAnchor;

  return el;
}

function sanitizeViewport(raw: unknown): Viewport {
  if (!raw || typeof raw !== 'object') return { scale: 1, x: 0, y: 0 };
  const v = raw as Record<string, unknown>;
  return {
    scale: clampNumber(v.scale, 0.1, 5, 1),
    x: clampNumber(v.x, -50000, 50000, 0),
    y: clampNumber(v.y, -50000, 50000, 0),
  };
}

export type ValidateResult =
  | { ok: true; doc: SchemaDocument }
  | { ok: false; error: string };

export function validateSchemaDocument(raw: unknown): ValidateResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Файл не является объектом JSON.' };
  }

  const o = raw as Record<string, unknown>;

  if (!Array.isArray(o.elements)) {
    return { ok: false, error: 'В файле нет массива elements.' };
  }

  if (o.elements.length > LIMITS.maxElements) {
    return {
      ok: false,
      error: `Слишком много элементов (макс. ${LIMITS.maxElements}).`,
    };
  }

  const elements: SchemaElement[] = [];
  for (const item of o.elements) {
    const el = sanitizeElement(item);
    if (el) elements.push(el);
  }

  const now = new Date().toISOString();
  const name =
    typeof o.name === 'string'
      ? sanitizeDocName(o.name)
      : 'Импорт';

  const doc: SchemaDocument = {
    version: 1,
    name,
    viewport: sanitizeViewport(o.viewport),
    elements,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt.slice(0, 30) : now,
    updatedAt: now,
  };

  return { ok: true, doc };
}

export function readJsonFile(file: File): Promise<unknown> {
  if (file.size > LIMITS.maxImportBytes) {
    return Promise.reject(new Error('Файл слишком большой (макс. 2 МБ).'));
  }
  if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) {
    return Promise.reject(new Error('Ожидается файл .json'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch {
        reject(new Error('Некорректный JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsText(file);
  });
}
