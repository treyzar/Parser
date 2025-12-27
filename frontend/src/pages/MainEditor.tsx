// src/components/editor/Editor.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveAs } from "file-saver";
import { templatesApi } from "../api/client";
import { LOCALSTORAGE_KEY } from "../utils/constants/editor.constants";
import { A4_HEIGHT, A4_WIDTH } from "../utils/constants/editor.constants";
import type {
  TVisibilityType,
  IEditorElement,
} from "../utils/types/editor.types";
import { HelpCircle, Move } from "lucide-react";

/* ---------- компоненты ---------- */
import Canvas from "../components/editor/Canvas";
import CanvasToolbar from "../components/editor/CanvasToolbar";
import ElementsPanel from "../components/editor/ElementsPanel";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import Modal from "../components/editor/documentation/Modal";
import DocumentationPanel from "../components/editor/documentation/DocumentationPanel";

/* ---------- хуки ---------- */
import { useAutoZoom } from "../hooks/editorHooks/useAutoZoom";
import { useHistory } from "../hooks/editorHooks/useHistory";
import { useDragResize } from "../hooks/editorHooks/useDragResize";
import { useKeyboard } from "../hooks/editorHooks/useKeyboard";

/* ---------- утилиты ---------- */
import { generateId } from "../utils/help/generateID";
import { snapToGrid } from "../utils/help/snapToGrid";
import { createDefaultElement } from "../utils/help/createDefaultElement";
import { generateDocx } from "../utils/help/generateDocx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Editor() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as any)?.prefillText as string | undefined;

  /* ---------- состояние ---------- */
  const [elements, setElements] = useState<IEditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<TVisibilityType>("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridStep, setGridStep] = useState(20);
  const [isDocOpen, setIsDocOpen] = useState(false);

  /* ---------- история (объявлена раньше) ---------- */
  const { saveToHistory, undo, redo, canUndo, canRedo } = useHistory(elements);

  /* ---------- зум ---------- */
  const canvasContainerRef = useRef<HTMLDivElement>(null!);
  const { zoom, autoZoom, isManualZoom, setZoom } =
    useAutoZoom(canvasContainerRef);

  /* ---------- helpers (объявлены раньше) ---------- */
  const updateElement = useCallback(
    (id: string, upd: Partial<IEditorElement>) => {
      const next = elements.map((el) =>
        el.id === id ? { ...el, ...upd } : el
      );
      setElements(next);
      saveToHistory(next);
    },
    [elements, saveToHistory]
  );

  const updateProperties = useCallback(
    (id: string, props: any) => {
      const next = elements.map((el) =>
        el.id === id
          ? { ...el, properties: { ...el.properties, ...props } }
          : el
      );
      setElements(next);
      saveToHistory(next);
    },
    [elements, saveToHistory]
  );

  const deleteElement = useCallback(
    (id: string) => {
      const next = elements.filter((el) => el.id !== id);
      setElements(next);
      saveToHistory(next);
      setSelectedId(null);
    },
    [elements, saveToHistory]
  );

  const moveLayer = useCallback(
    (id: string, dir: "front" | "back") => {
      const arr = [...elements];
      const idx = arr.findIndex((el) => el.id === id);
      if (idx === -1) return;
      const [el] = arr.splice(idx, 1);
      dir === "front" ? arr.push(el) : arr.unshift(el);
      const next = arr.map((e, i) => ({ ...e, zIndex: i }));
      setElements(next);
      saveToHistory(next);
    },
    [elements, saveToHistory]
  );

  /* ---------- drag/resize (теперь объявлен после helpers) ---------- */
  const {
    isDragging,
    isResizing,
    dragOffset,
    resizeHandle,
    startDrag,
    startResize,
    stopDragResize,
  } = useDragResize(elements, selectedId, updateElement, snapToGrid);

  /* ---------- клавиатура ---------- */
  useKeyboard({
    selectedId,
    elements,
    setElements,
    saveToHistory,
    setSelectedId,
    deleteElement,
    undo,
    redo,
  });

  /* ---------- экспорт ---------- */
  const exportDocx = async () => {
    if (!elements.length) return setError("Нет элементов");
    setLoading(true);
    try {
      const blob = await generateDocx(elements, title, description);
      saveAs(blob, `${title || "document"}.docx`);
    } catch (e: any) {
      setError("Ошибка DOCX: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;margin:0;padding:20px;position:relative;width:794px;min-height:1123px;background:white;}.container{position:relative;width:100%;height:100%;}*{box-sizing:border-box;}@media print{body{width:210mm;min-height:297mm;}}</style></head><body><div class="container">${elements
      .map((el) => {
        if (el.type === "text") {
          const {
            content,
            fontFamily,
            fontSize,
            color,
            bold,
            italic,
            underline,
            align,
          } = el.properties as any;
          return `<div style="position:absolute;left:${el.x}px;top:${
            el.y
          }px;width:${el.width}px;height:${
            el.height
          }px"><p style="margin:0;font-family:${fontFamily};font-size:${fontSize}px;color:${color};font-weight:${
            bold ? "bold" : "normal"
          };font-style:${italic ? "italic" : "normal"};text-decoration:${
            underline ? "underline" : "none"
          };text-align:${align}">${content}</p></div>`;
        }
        if (el.type === "image") {
          const { src, alt } = el.properties as any;
          return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px"><img src="${src}" alt="${alt}" style="width:100%;height:100%;object-fit:cover"></div>`;
        }
        return "";
      })
      .join("")}</div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    saveAs(blob, `${title || "template"}.html`);
  };

  const exportPdf = async () => {
    try {
      const container = canvasContainerRef.current;
      if (!container) return setError("Холст не найден");
      const canvasImg = await html2canvas(container, { scale: 2 });
      const imgData = canvasImg.toDataURL("image/png");
      const pdf = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: "portrait",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save(`${title || "document"}.pdf`);
    } catch (e: any) {
      setError("Ошибка PDF: " + (e?.message || e));
    }
  };

  /* ---------- сохранение шаблона ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Введите название");
    if (!elements.length) return setError("Добавьте элементы");
    setLoading(true);
    try {
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body>${elements
        .map((el) => `<div>${(el.properties as any).content || ""}</div>`)
        .join("")}</body></html>`;
      await templatesApi.create({
        title,
        description,
        visibility,
        html_content: htmlContent,
        allowed_users: [],
        template_type: "HTML",
      });
      localStorage.removeItem(LOCALSTORAGE_KEY);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- автосохранение + загрузка черновика ---------- */
  useEffect(() => {
    const draft = localStorage.getItem(LOCALSTORAGE_KEY);
    if (draft) {
      try {
        const { elements: els, title: t, description: d } = JSON.parse(draft);
        setElements(els || []);
        setTitle(t || "");
        setDescription(d || "");
        saveToHistory(els || []);
      } catch {}
    }
    // if opened with prefill text (from parser), create a text element
    if (prefill && (!draft || JSON.parse(draft).elements?.length === 0)) {
      const el = createDefaultElement("text", generateId(), snapToGrid);
      el.properties = { ...(el.properties as any), content: prefill };
      const next = [el];
      setElements(next);
      saveToHistory(next);
      setSelectedId(el.id);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({ elements, title, description })
      );
    }, 30_000);
    return () => clearInterval(t);
  }, [elements, title, description]);

  /* ---------- обработка загрузки изображений ---------- */
  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const newEl: IEditorElement = {
          id: generateId(),
          type: "image",
          x: snapToGrid(A4_WIDTH / 2 - 125),
          y: snapToGrid(A4_HEIGHT / 2 - 100),
          width: 250,
          height: 200,
          zIndex: elements.length,
          properties: { src, alt: file.name, file },
        };
        const next = [...elements, newEl];
        setElements(next);
        saveToHistory(next);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    },
    [elements, snapToGrid]
  );

  /* ---------- глобальный обработчик движения мыши ---------- */
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;

    const onMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const rect = node.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const el = elements.find((i) => i.id === selectedId);
      if (!el) return;

      if (isDragging) {
        const nx = snapToGrid(x - dragOffset.x);
        const ny = snapToGrid(y - dragOffset.y);
        updateElement(selectedId!, {
          x: Math.max(0, Math.min(nx, A4_WIDTH - el.width)),
          y: Math.max(0, Math.min(ny, A4_HEIGHT - el.height)),
        });
      }

      if (isResizing) {
        let w = el.width,
          h = el.height,
          dx = el.x,
          dy = el.y;

        if (resizeHandle.includes("right")) w = snapToGrid(x - el.x);
        if (resizeHandle.includes("bottom")) h = snapToGrid(y - el.y);
        if (resizeHandle.includes("left")) {
          w = snapToGrid(el.x + el.width - x);
          dx = el.x + el.width - w;
        }
        if (resizeHandle.includes("top")) {
          h = snapToGrid(el.y + el.height - y);
          dy = el.y + el.height - h;
        }

        updateElement(selectedId!, {
          x: Math.max(0, dx),
          y: Math.max(0, dy),
          width: Math.max(50, w),
          height: Math.max(30, h),
        });
      }
    };

    const onUp = () => stopDragResize();

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseup", onUp);

    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseup", onUp);
    };
  }, [
    isDragging,
    isResizing,
    selectedId,
    zoom,
    elements,
    dragOffset,
    resizeHandle,
    updateElement,
    stopDragResize,
  ]);

  /* ---------- рендер ---------- */
  return (
    <div className="container-1600">
      <nav className="nav">
        <div className="nav-inner">
          <a href="/dashboard" className="nav-brand">
            ← Редактор шаблонов
          </a>
          <button
            className="btn btn-secondary"
            onClick={() => setIsDocOpen(true)}
          >
            <HelpCircle size={20} />
            Справка
          </button>
        </div>
      </nav>

      <Modal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
        title="Документация"
      >
        <DocumentationPanel />
      </Modal>

      {error && <div className="error-message mb-4">{error}</div>}

      <div className="surface mb-6">
        <div className="grid grid-2" style={{ padding: "var(--sp-6)" }}>
          <div className="form-group">
            <label className="label">Название шаблона *</label>
            <input
              className="input input-highlight"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Договор о поставке"
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Видимость</label>
            <select
              className="select input-highlight"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as TVisibilityType)}
            >
              <option value="PUBLIC">Публичный</option>
              <option value="RESTRICTED">Ограниченный</option>
            </select>
          </div>
        </div>
        <div
          className="form-group"
          style={{ padding: "0 var(--sp-6) var(--sp-6)" }}
        >
          <label className="label">Описание</label>
          <textarea
            className="input textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание шаблона"
          />
        </div>
      </div>

      <div className="editor-layout">
        <div className="panel panel-left">
          <ElementsPanel
            onAdd={(type) => {
              const el = createDefaultElement(type, generateId(), snapToGrid);
              const next = [...elements, el];
              setElements(next);
              saveToHistory(next);
              setSelectedId(el.id);
            }}
            onImageUpload={handleImageUpload}
            gridVisible={gridVisible}
            onToggleGrid={setGridVisible}
            zoom={zoom}
            autoZoom={autoZoom}
            isManualZoom={isManualZoom}
            onZoomChange={setZoom}
          />
        </div>

        <div className="panel panel-center" ref={canvasContainerRef}>
          <CanvasToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onClear={() => {
              if (!confirm("Очистить холст?")) return;
              setElements([]);
              saveToHistory([]);
              setSelectedId(null);
            }}
            onExportDocx={exportDocx}
            onExportHtml={exportHtml}
            onExportPdf={exportPdf}
            gridVisible={gridVisible}
            gridStep={gridStep}
            onToggleGrid={setGridVisible}
            onGridStepChange={setGridStep}
          />

          <Canvas
            ref={canvasRef}
            elements={elements}
            selectedId={selectedId}
            gridVisible={gridVisible}
            zoom={zoom}
            onSelect={setSelectedId}
            onElementMoveStart={(id, offsetX, offsetY) => {
              // FIX: Начинаем перетаскивание с правильным offset
              startDrag(id, offsetX, offsetY);
            }}
            onElementResizeStart={(id, handle) => {
              startResize(id, handle);
            }}
            onUpdateProp={updateProperties}
            onImageUpload={handleImageUpload}
          />

          <div className="shift-hint">
            {snapToGrid(0) !== 0 && (
              <div className="shift-indicator">
                <Move size={12} />
                Привязка к сетке активна
              </div>
            )}
          </div>
        </div>

        <div className="panel panel-right">
          <PropertiesPanel
            selected={elements.find((el) => el.id === selectedId) || null}
            onUpdateEl={updateElement}
            onUpdateProps={updateProperties}
            onDelete={deleteElement}
            onMoveLayer={moveLayer}
          />
        </div>
      </div>

      <div className="surface mt-6" style={{ padding: "var(--sp-6)" }}>
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Назад
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Сохранение..." : "Сохранить шаблон"}
          </button>
        </div>
      </div>

      <style>{`
        :root {
          --c-bg-100: #F7F8F8;
          --c-bg-200: #F1F3F4;
          --c-bg-300: #E3E6E8;
          --c-ink-800: #2F3235;
          --c-ink-900: #26292A;
          --c-ink-600: #6c757d;
          --c-ink-400: #adb5bd;
          --c-accent: #E73F0C;
          --c-accent-light: rgba(231, 63, 12, 0.08);
          --c-accent-border: rgba(231, 63, 12, 0.3);
          --radius-sm: 6px;
          --radius-md: 10px;
          --shadow-sm: 0 2px 8px rgba(38, 41, 42, 0.07);
          --shadow-md: 0 6px 18px rgba(38, 41, 42, 0.10);
          --border: 1px solid rgba(47, 50, 53, 0.08);
          --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
          --fs-1: clamp(22px, 2.6vw, 32px);
          --fs-2: clamp(18px, 2vw, 24px);
          --fs-3: 18px;
          --fs-4: 16px;
          --fs-5: 14px;
          --sp-1: 4px;
          --sp-2: 8px;
          --sp-3: 12px;
          --sp-4: 16px;
          --sp-5: 20px;
          --sp-6: 24px;
          --sp-7: 32px;
          --sp-8: 40px;
          --ring: 0 0 0 .18rem rgba(231, 63, 12, .18);
          --grid-color: rgba(47, 50, 53, 0.06);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --c-bg-100: #2F3235;
            --c-bg-200: #26292A;
            --c-bg-300: #1a1d1f;
            --c-ink-800: #F4F4F4;
            --c-ink-900: #DEE1E2;
            --c-ink-600: #b8bec4;
            --c-ink-400: #8d949a;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
            --shadow-md: 0 10px 24px rgba(0, 0, 0, 0.45);
            --grid-color: rgba(244, 244, 244, 0.08);
          }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-sans); background: var(--c-bg-200); color: var(--c-ink-800); line-height: 1.5; min-height: 100vh; }
        .container-1600 { max-width: 1600px; margin: 0 auto; padding: 0 var(--sp-4) var(--sp-6); }
        .surface { background: var(--c-bg-100); border: var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); }
        .nav { background: var(--c-bg-100); border-bottom: var(--border); padding: var(--sp-4) var(--sp-6); margin-bottom: var(--sp-6); position: sticky; top: 0; z-index: 100; }
        .nav-inner { max-width: 1600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { font-size: var(--fs-3); font-weight: 700; color: var(--c-ink-800); text-decoration: none; display: flex; align-items: center; gap: var(--sp-2); }
        .error-message { background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: var(--sp-4); border-radius: var(--radius-sm); margin-bottom: var(--sp-4); }
        .grid { display: grid; gap: var(--sp-4); }
        .grid-2 { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        .flex { display: flex; }
        .flex-between { justify-content: space-between; align-items: center; }
        .gap-3 { gap: var(--sp-3); }
        .mb-6 { margin-bottom: var(--sp-6); }
        .mt-6 { margin-top: var(--sp-6); }
        .form-group { margin-bottom: var(--sp-5); }
        .label { display: flex; align-items: center; gap: var(--sp-2); font-size: var(--fs-5); font-weight: 500; margin-bottom: var(--sp-2); color: var(--c-ink-800); }
        .input, .select, .textarea { width: 100%; padding: var(--sp-3) var(--sp-4); border: var(--border); border-radius: var(--radius-sm); font-size: var(--fs-4); background: var(--c-bg-100); color: var(--c-ink-800); transition: border-color 0.16s ease, box-shadow 0.16s ease; }
        .input-highlight { border-left: 4px solid var(--c-accent); background: var(--c-bg-100); }
        .input-highlight:focus { border-color: var(--c-accent); box-shadow: var(--ring); }
        .textarea { resize: vertical; min-height: 120px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2); padding: var(--sp-3) var(--sp-5); border-radius: var(--radius-sm); font-size: var(--fs-5); font-weight: 500; cursor: pointer; transition: all 0.16s ease; border: none; text-decoration: none; }
        .btn:focus { outline: none; box-shadow: var(--ring); }
        .btn-primary { background: var(--c-accent); color: white; }
        .btn-primary:hover:not(:disabled) { background: #c93509; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: var(--c-bg-100); color: var(--c-ink-800); border: var(--border); }
        .btn-secondary:hover:not(:disabled) { background: var(--c-bg-200); }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        .editor-layout { display: grid; grid-template-columns: 280px 1fr 340px; gap: var(--sp-5); min-height: 800px; }
        .panel { background: var(--c-bg-100); border: var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: var(--sp-5); height: fit-content; overflow-y: auto; }
        .panel-center { padding: var(--sp-5); overflow: auto; max-height: calc(100vh - 200px); }
        .panel-left, .panel-right { position: sticky; top: var(--sp-4); max-height: calc(100vh - 200px); overflow-y: auto; }
        .canvas { position: relative; border: 2px solid var(--c-bg-200); border-radius: var(--radius-md); min-height: 600px; box-shadow: var(--shadow-md); background: white; overflow: hidden; width: 794px; height: 1123px; transform-origin: top left; }
        .shift-indicator { position: absolute; top: var(--sp-2); right: var(--sp-2); z-index: 10; display: flex; align-items: center; gap: var(--sp-1); padding: var(--sp-1) var(--sp-2); background: var(--c-accent); color: white; border-radius: var(--radius-sm); font-size: 0.75rem; }
        @media (max-width: 1024px) { .editor-layout { grid-template-columns: 1fr; grid-template-areas: "left" "center" "right"; gap: var(--sp-4); } .panel { max-height: none; } .panel-left, .panel-right { position: static; } }
        @media (max-width: 768px) { .container-1600 { padding: var(--sp-4); } .panel-left, .panel-right { display: none; } .editor-layout { grid-template-areas: "center"; } }
      `}</style>
    </div>
  );
}
