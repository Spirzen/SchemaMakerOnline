import { useEffect, useRef } from 'react';
import type { SchemaElement, Viewport } from '../types/schema';
import { getElementBounds } from '../utils/bounds';
import { canElementHaveText } from '../utils/shapes';
import './TextEditorOverlay.css';

interface Props {
  element: SchemaElement;
  viewport: Viewport;
  canvasRect: DOMRect;
  onSave: (text: string) => void;
  onClose: () => void;
}

function editorLayout(element: SchemaElement) {
  const w = element.width ?? 120;
  const h = element.height ?? 80;

  if (element.type === 'text') {
    const borderless = (element.strokeWidth ?? 0) === 0;
    return {
      padX: borderless ? 2 : 10,
      padY: borderless ? 2 : 10,
      align: 'left' as const,
      transparent: borderless,
    };
  }

  if (element.type === 'comment') {
    return { padX: 14, padY: 14, align: 'left' as const, transparent: false };
  }

  if (element.type === 'circle' || element.type === 'diamond') {
    const pad = Math.min(w, h) * 0.2;
    return { padX: pad, padY: pad, align: 'center' as const, transparent: true };
  }

  if (element.type === 'triangle') {
    return {
      padX: w * 0.15,
      padY: h * 0.32,
      align: 'center' as const,
      transparent: true,
    };
  }

  return { padX: 14, padY: 14, align: 'center' as const, transparent: true };
}

export function TextEditorOverlay({
  element,
  viewport,
  canvasRect,
  onSave,
  onClose,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bounds = getElementBounds(element);
  const layout = editorLayout(element);

  const left = canvasRect.left + bounds.x * viewport.scale + viewport.x + layout.padX * viewport.scale;
  const top = canvasRect.top + bounds.y * viewport.scale + viewport.y + layout.padY * viewport.scale;
  const width = Math.max(
    48,
    bounds.width * viewport.scale - layout.padX * 2 * viewport.scale,
  );
  const height = Math.max(
    28,
    bounds.height * viewport.scale - layout.padY * 2 * viewport.scale,
  );

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    if (!element.text) {
      ta.setSelectionRange(0, 0);
    } else {
      ta.select();
    }
  }, [element.text]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!canElementHaveText(element.type)) return null;

  return (
    <textarea
      ref={textareaRef}
      className={`text-editor-overlay ${layout.transparent ? 'text-editor-overlay--inline' : ''}`}
      style={{
        left,
        top,
        width,
        height,
        fontSize: (element.fontSize ?? 14) * viewport.scale,
        color: element.stroke,
        textAlign: layout.align,
      }}
      placeholder={element.type === 'comment' ? 'Комментарий…' : 'Текст'}
      defaultValue={element.text ?? ''}
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSave((e.target as HTMLTextAreaElement).value);
        }
      }}
    />
  );
}
