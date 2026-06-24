import { useCallback, useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { SchemaCanvas } from './components/SchemaCanvas';
import { ShapePalette } from './components/ShapePalette';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { TextEditorOverlay } from './components/TextEditorOverlay';
import { useSchemaStore } from './hooks/useSchemaStore';
import type { ToolMode } from './types/schema';
import { createElementAt } from './utils/createElement';
import { canElementHaveText } from './utils/shapes';
import {
  downloadDataUrl,
  downloadJson,
  exportStageImage,
  exportStagePdf,
} from './utils/export';
import { sanitizeDocName, sanitizeFilename } from './utils/sanitize';
import { clearDraft, loadDraft, saveDraft } from './utils/storage';
import { readJsonFile, validateSchemaDocument } from './utils/validateDocument';
import './App.css';

const AUTOSAVE_MS = 1500;

export default function App() {
  const { state, dispatch, toDocument } = useSchemaStore();
  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const hydrated = useRef(false);

  const editingElement = editingTextId
    ? state.elements.find((e) => e.id === editingTextId) ?? null
    : null;

  const selected =
    state.selectedIds.length === 1
      ? state.elements.find((e) => e.id === state.selectedIds[0]) ?? null
      : null;

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: 'LOAD_DOCUMENT', doc: draft });
    }
    hydrated.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = window.setTimeout(() => {
      saveDraft(toDocument());
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [state.elements, state.viewport, state.docName, toDocument]);

  const startTextEdit = useCallback((id: string) => {
    if (canvasWrapRef.current) {
      setCanvasRect(canvasWrapRef.current.getBoundingClientRect());
    }
    setEditingTextId(id);
  }, []);

  const handleDropShape = useCallback(
    (tool: ToolMode, x: number, y: number) => {
      const el = createElementAt(tool, x, y, {
        fill: state.fillColor,
        stroke: state.strokeColor,
        strokeWidth: state.strokeWidth,
      });
      if (el) {
        dispatch({ type: 'ADD_ELEMENT', element: el });
        dispatch({ type: 'SELECT', ids: [el.id], mode: 'replace' });
        dispatch({ type: 'SET_TOOL', tool: 'select' });
        if (canElementHaveText(el.type)) {
          window.setTimeout(() => startTextEdit(el.id), 0);
        }
      }
    },
    [state.fillColor, state.strokeColor, state.strokeWidth, dispatch, startTextEdit],
  );

  useEffect(() => {
    const update = () => {
      const sidePanels = window.innerWidth < 900 ? 0 : 420;
      setStageSize({
        w: Math.max(320, window.innerWidth - sidePanels),
        h: Math.max(240, window.innerHeight - 56),
      });
      if (canvasWrapRef.current) {
        setCanvasRect(canvasWrapRef.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (editingTextId && canvasWrapRef.current) {
      setCanvasRect(canvasWrapRef.current.getBoundingClientRect());
    }
  }, [editingTextId, state.viewport]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        dispatch({ type: 'DELETE_SELECTED' });
      }
      if (e.key === 'Escape') {
        if (editingTextId) {
          setEditingTextId(null);
          return;
        }
        dispatch({ type: 'SELECT', ids: [] });
        dispatch({ type: 'SET_TOOL', tool: 'select' });
      }
      if (e.key === 'F2') {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (selected && canElementHaveText(selected.type)) {
          e.preventDefault();
          startTextEdit(selected.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, editingTextId, selected, startTextEdit]);

  const handleExportImage = useCallback(
    async (format: 'png' | 'jpeg') => {
      const stage = stageRef.current;
      if (!stage) return;
      const dataUrl = await exportStageImage(stage, format === 'jpeg' ? 'jpeg' : 'png');
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const safeName = sanitizeFilename(state.docName);
      downloadDataUrl(dataUrl, `${safeName}.${ext}`);
    },
    [state.docName],
  );

  const handleExportPdf = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    const safeName = sanitizeFilename(state.docName);
    await exportStagePdf(stage, safeName);
  }, [state.docName]);

  const handleExportJson = useCallback(() => {
    const doc = toDocument();
    const safeName = sanitizeFilename(state.docName);
    downloadJson(doc, `${safeName}.json`);
  }, [toDocument, state.docName]);

  const handleImportJson = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      try {
        const raw = await readJsonFile(file);
        const result = validateSchemaDocument(raw);
        if (!result.ok) {
          setImportError(result.error);
          return;
        }
        dispatch({ type: 'LOAD_DOCUMENT', doc: result.doc });
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Ошибка импорта.');
      }
    },
    [dispatch],
  );

  const handleNewDocument = useCallback(() => {
    if (
      state.elements.length > 0 &&
      !window.confirm('Создать новую схему? Черновик в браузере будет заменён.')
    ) {
      return;
    }
    clearDraft();
    dispatch({
      type: 'LOAD_DOCUMENT',
      doc: {
        version: 1,
        name: 'Без названия',
        viewport: { scale: 1, x: 0, y: 0 },
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    setImportError(null);
  }, [dispatch, state.elements.length]);

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={onFileChange}
      />
      <Toolbar
        docName={state.docName}
        onDocNameChange={(name) =>
          dispatch({ type: 'SET_DOC_NAME', name: sanitizeDocName(name) })
        }
        onExportPng={() => handleExportImage('png')}
        onExportJpg={() => handleExportImage('jpeg')}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onNewDocument={handleNewDocument}
        selectionCount={state.selectedIds.length}
        onDelete={() => dispatch({ type: 'DELETE_SELECTED' })}
        onZoomIn={() =>
          dispatch({
            type: 'SET_VIEWPORT',
            viewport: {
              scale: Math.min(state.viewport.scale * 1.15, 3),
            },
          })
        }
        onZoomOut={() =>
          dispatch({
            type: 'SET_VIEWPORT',
            viewport: {
              scale: Math.max(state.viewport.scale / 1.15, 0.2),
            },
          })
        }
        onZoomReset={() =>
          dispatch({
            type: 'SET_VIEWPORT',
            viewport: { scale: 1, x: 0, y: 0 },
          })
        }
        zoom={state.viewport.scale}
      />
      {importError && (
        <div className="app-toast app-toast-error" role="alert">
          {importError}
          <button type="button" onClick={() => setImportError(null)} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
      <div className="app-body">
        <ShapePalette
          activeTool={state.tool}
          onToolChange={(tool) => dispatch({ type: 'SET_TOOL', tool })}
        />
        <main className={`app-main tool-${state.tool}`}>
          {state.tool === 'connector' && (
            <div className="canvas-hint">
              Потяните от точки на фигуре к другой фигуре
            </div>
          )}
          {state.tool === 'select' && (
            <div className="canvas-hint canvas-hint-subtle">
              Двойной клик — текст · F2 — правка · Пробел+перетаскивание — панорама · колёсико — масштаб
            </div>
          )}
          <div className="canvas-container" ref={canvasWrapRef}>
          <SchemaCanvas
            elements={state.elements}
            selectedIds={state.selectedIds}
            tool={state.tool}
            viewport={state.viewport}
            strokeColor={state.strokeColor}
            fillColor={state.fillColor}
            strokeWidth={state.strokeWidth}
            stageRef={stageRef}
            stageWidth={stageSize.w}
            stageHeight={stageSize.h}
            onSelect={(ids, mode) =>
              dispatch({ type: 'SELECT', ids, mode: mode ?? 'replace' })
            }
            onDropShape={handleDropShape}
            onAdd={(el) => dispatch({ type: 'ADD_ELEMENT', element: el })}
            onUpdate={(id, patch) =>
              dispatch({ type: 'UPDATE_ELEMENT', id, patch })
            }
            onViewport={(v) => dispatch({ type: 'SET_VIEWPORT', viewport: v })}
            onElementsReplace={(elements) =>
              dispatch({ type: 'SET_ELEMENTS', elements })
            }
            onEditText={startTextEdit}
          />
          {editingElement && canvasRect && (
            <TextEditorOverlay
              element={editingElement}
              viewport={state.viewport}
              canvasRect={canvasRect}
                onSave={(text) => {
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    id: editingElement.id,
                    patch: { text: text.slice(0, 4000) },
                  });
                  setEditingTextId(null);
                }}
              onClose={() => setEditingTextId(null)}
            />
          )}
          </div>
        </main>
        <PropertiesPanel
          selected={selected}
          selectionCount={state.selectedIds.length}
          strokeColor={state.strokeColor}
          fillColor={state.fillColor}
          strokeWidth={state.strokeWidth}
          onStrokeColor={(stroke) => dispatch({ type: 'SET_COLORS', stroke })}
          onFillColor={(fill) => dispatch({ type: 'SET_COLORS', fill })}
          onStrokeWidth={(width) =>
            dispatch({ type: 'SET_STROKE_WIDTH', width })
          }
          onUpdateSelected={(patch) => {
            if (state.selectedIds[0]) {
              dispatch({
                type: 'UPDATE_ELEMENT',
                id: state.selectedIds[0],
                patch,
              });
            }
          }}
        />
      </div>
      <footer className="app-footer">
        <span>Данные только в вашем браузере · без сервера и регистрации</span>
      </footer>
    </div>
  );
}
