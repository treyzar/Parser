import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { templatesApi } from "../../api/client";
import type {
  TVisibilityType,
  IEditorElement,
  TElementType,
} from "../../utils/types/editor.types";
import { HelpCircle, Move } from "lucide-react";
import {
  LOCALSTORAGE_KEY,
  A4_WIDTH,
  A4_HEIGHT,
} from "../../utils/constants/editor.constants";
import { generateId } from "../../utils/help/generateID";
import { generateDocx } from "../../utils/help/generateDocx";
import { snapToGrid } from "../../utils/help/snapToGrid";
import { useDragResize } from "../../hooks/editorHooks/useDragResize";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useHistory } from "../../hooks/editorHooks/useHistory";
import { useKeyboard } from "../../hooks/editorHooks/useKeyboard";
import { useAutoZoom } from "../../hooks/editorHooks/useAutoZoom";

import Canvas from "./Canvas";
import CanvasToolbar from "./CanvasToolbar";
import ElementsPanel from "./ElementsPanel";
import PropertiesPanel from "./PropertiesPanel";
import Modal from "./documentation/Modal";
import DocumentationPanel from "./documentation/DocumentationPanel";

export default function Editor() {
  const navigate = useNavigate();

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
  const [sigOpen, setSigOpen] = useState(false);
  const [sigTargetId, setSigTargetId] = useState<string | null>(null);
  const [sigStrokes, setSigStrokes] = useState<
    Array<Array<{ x: number; y: number }>>
  >([]);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigBgImageRef = useRef<HTMLImageElement | null>(null);
  const sigCurrentStroke = useRef<Array<{ x: number; y: number }>>([]);

  /* ---------- история ---------- */
  const { saveToHistory, undo, redo, canUndo, canRedo } = useHistory(elements);

  const handleImageUpload = (file: File) => {
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
  };

  /* ---------- zoom ---------- */
  const canvasContainerRef = useRef<HTMLDivElement>(null!);
  const { zoom, autoZoom, isManualZoom, setZoom } =
    useAutoZoom(canvasContainerRef);

  const {
    isDragging,
    isResizing,
    dragOffset,
    resizeHandle,
    startDrag,
    startResize,
    stopDragResize,
  } = useDragResize(
    elements,
    selectedId,
    (id, upd) => updateElement(id, upd),
    snapToGrid
  );

  /* ---------- клавиатура ---------- */

  const deleteElement = useCallback(
    (id: string) => {
      const next = elements.filter((el) => el.id !== id);
      setElements(next);
      saveToHistory(next);
      setSelectedId(null);
    },
    [elements, saveToHistory]
  );

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

  /* ---------- helpers ---------- */
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

  const openSignatureEditor = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    // load existing image as background
    const imgSrc = (el.properties as any)?.image || "";
    sigBgImageRef.current = null;
    setSigStrokes([]);
    setSigTargetId(id);
    setSigOpen(true);
    if (imgSrc) {
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        sigBgImageRef.current = img;
        // draw once opened
        const c = sigCanvasRef.current;
        if (c) drawSignatureCanvas(c, []);
      };
    }
  };

  const closeSignatureEditor = () => {
    setSigOpen(false);
    setSigTargetId(null);
    setSigStrokes([]);
    sigBgImageRef.current = null;
  };

  const drawSignatureCanvas = (
    canvas: HTMLCanvasElement,
    strokes: Array<Array<{ x: number; y: number }>>
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    // clear
    ctx.clearRect(0, 0, w, h);
    // background
    if (sigBgImageRef.current) {
      ctx.drawImage(sigBgImageRef.current, 0, 0, w, h);
    }
    // strokes
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2 * dpr;
    for (const stroke of strokes) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * dpr, stroke[0].y * dpr);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * dpr, stroke[i].y * dpr);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!sigOpen || !sigTargetId) return;
    const el = elements.find((e) => e.id === sigTargetId);
    if (!el) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(100, Math.round(el.width)) * dpr;
    canvas.height = Math.max(30, Math.round(el.height)) * dpr;
    canvas.style.width = `${Math.max(100, Math.round(el.width))}px`;
    canvas.style.height = `${Math.max(30, Math.round(el.height))}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sigBgImageRef.current) {
        ctx.drawImage(sigBgImageRef.current, 0, 0, canvas.width, canvas.height);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2 * dpr;
      for (const stroke of sigStrokes) {
        if (!stroke.length) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x * dpr, stroke[0].y * dpr);
        for (let i = 1; i < stroke.length; i++)
          ctx.lineTo(stroke[i].x * dpr, stroke[i].y * dpr);
        ctx.stroke();
      }
    };

    redraw();

    let drawing = false;

    const toLocal = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width || 1;
      const scaleY = canvas.height / rect.height || 1;
      return {
        x: (ev.clientX - rect.left) * scaleX,
        y: (ev.clientY - rect.top) * scaleY,
      };
    };

    const onDown = (ev: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(ev.pointerId);
      sigCurrentStroke.current = [];
      const p = toLocal(ev);
      sigCurrentStroke.current.push(p);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };

    const onMove = (ev: PointerEvent) => {
      if (!drawing) return;
      const p = toLocal(ev);
      sigCurrentStroke.current.push(p);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };

    const onUp = (ev: PointerEvent) => {
      if (!drawing) return;
      drawing = false;
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch {}
      if (sigCurrentStroke.current.length) {
        setSigStrokes((s) => [...s, sigCurrentStroke.current.slice()]);
      }
      sigCurrentStroke.current = [];
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [sigOpen, sigTargetId, sigStrokes, elements]);

  const sigApply = () => {
    if (!sigTargetId) return;
    const c = sigCanvasRef.current;
    if (!c) return;
    const data = c.toDataURL("image/png");
    updateProperties(sigTargetId, { image: data });
    closeSignatureEditor();
  };

  const sigClear = () => {
    setSigStrokes([]);
    sigBgImageRef.current = null;
  };

  const sigUndo = () => {
    setSigStrokes((s) => (s.length ? s.slice(0, -1) : s));
  };

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
            onImageUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                const el: IEditorElement = {
                  id: generateId(),
                  type: "image",
                  x: snapToGrid(A4_WIDTH / 2 - 125),
                  y: snapToGrid(A4_HEIGHT / 2 - 100),
                  width: 250,
                  height: 200,
                  zIndex: elements.length,
                  properties: { src, alt: file.name, file },
                };
                const next = [...elements, el];
                setElements(next);
                saveToHistory(next);
                setSelectedId(el.id);
              };
              reader.readAsDataURL(file);
            }}
            gridVisible={gridVisible}
            onToggleGrid={setGridVisible}
            zoom={zoom}
            autoZoom={autoZoom}
            isManualZoom={isManualZoom}
            onZoomChange={setZoom}
          />
        </div>

        <div className="panel panel-center">
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

          <div
            ref={canvasContainerRef}
            style={{ padding: 20, display: "flex", justifyContent: "center" }}
          >
            <div
              style={{ background: "#f6f6f7", padding: 12, borderRadius: 8 }}
            >
              <Canvas
                ref={(r) => {
                  /* глобальный слушатель mousemove/mouseup вешаем тут */
                  if (!r) return;
                  const onMove = (e: MouseEvent) => {
                    if (!isDragging && !isResizing) return;
                    const rect = r.getBoundingClientRect();
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
                      if (resizeHandle.includes("right"))
                        w = snapToGrid(x - el.x);
                      if (resizeHandle.includes("bottom"))
                        h = snapToGrid(y - el.y);
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
                  r.addEventListener("mousemove", onMove);
                  r.addEventListener("mouseup", onUp);
                  return () => {
                    r.removeEventListener("mousemove", onMove);
                    r.removeEventListener("mouseup", onUp);
                  };
                }}
                elements={elements}
                selectedId={selectedId}
                gridVisible={gridVisible}
                zoom={zoom}
                onSelect={setSelectedId}
                onElementMoveStart={(id, offsetX, offsetY) =>
                  startDrag(id, offsetX, offsetY)
                }
                onElementResizeStart={(id, handle) => startResize(id, handle)}
                onUpdateProp={updateProperties}
                onImageUpload={handleImageUpload}
                onEditSignature={openSignatureEditor}
                gridStep={gridStep}
              />
            </div>
          </div>

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
            onEditSignature={openSignatureEditor}
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

      <style>{/* ваш огромный блок CSS остаётся без изменений */}</style>
      <Modal
        isOpen={sigOpen}
        onClose={() => closeSignatureEditor()}
        title="Редактировать подпись"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <canvas
              ref={sigCanvasRef}
              style={{ border: "1px solid #e5e7eb", borderRadius: 6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={sigUndo}
            >
              Отменить
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={sigClear}
            >
              Очистить
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                // allow uploading image into signature editor
                const inp = document.createElement("input");
                inp.type = "file";
                inp.accept = "image/*";
                inp.onchange = () => {
                  const f = inp.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = (ev) => {
                    const img = new Image();
                    img.src = ev.target?.result as string;
                    img.onload = () => {
                      sigBgImageRef.current = img;
                      drawSignatureCanvas(sigCanvasRef.current!, sigStrokes);
                    };
                  };
                  r.readAsDataURL(f);
                };
                inp.click();
              }}
            >
              Загрузить изображение
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={sigApply}
            >
              Применить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- маленькая утилита ---------- */
function createDefaultElement(
  type: TElementType,
  id: string,
  snap: (v: number) => number
): IEditorElement {
  const base = {
    id,
    x: snap(A4_WIDTH / 2 - 150),
    y: snap(A4_HEIGHT / 2 - 100),
    zIndex: 0,
  };
  if (type === "text")
    return {
      ...base,
      type,
      width: 300,
      height: 80,
      properties: {
        content: "Новый текст",
        fontFamily: "Inter",
        fontSize: 14,
        color: "#1a1a1a",
        bold: false,
        italic: false,
        underline: false,
        align: "left",
      },
    };
  if (type === "image")
    return {
      ...base,
      type,
      width: 250,
      height: 200,
      properties: { src: "", alt: "Image" },
    };
  if (type === "table")
    return {
      ...base,
      type,
      width: 400,
      height: 200,
      properties: {
        rows: 3,
        cols: 3,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        cellBg: "transparent",
        data: Array(3)
          .fill(null)
          .map(() => Array(3).fill("")),
      },
    };
  if (type === "date")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: {
        format: "DD.MM.YYYY",
        value: new Date().toISOString().split("T")[0],
      },
    };
  if (type === "signature")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: { text: "Подпись", fontSize: 16, color: "#1a1a1a" },
    };
  if (type === "divider")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: { thickness: 1, color: "#1a1a1a", style: "solid" },
    };
  throw new Error("unknown type");
}
