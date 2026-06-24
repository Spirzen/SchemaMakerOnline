import type { ElementType } from '../types/schema';

/** Rhombus inscribed in w×h bounding box (top/right/bottom/left vertices). */
export function diamondPoints(w: number, h: number): number[] {
  return [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
}

/** Triangle inscribed in w×h bounding box. */
export function trianglePoints(w: number, h: number): number[] {
  return [w / 2, 0, w, h, 0, h];
}

const TEXT_CAPABLE: ReadonlySet<ElementType> = new Set([
  'rectangle',
  'roundedRect',
  'circle',
  'diamond',
  'triangle',
  'text',
  'comment',
]);

export function canElementHaveText(type: ElementType): boolean {
  return TEXT_CAPABLE.has(type);
}
