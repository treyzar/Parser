// src/components/editor/Editor.tsx

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveAs } from "file-saver";

/* API и константы */
import { templatesApi } from "../api/client";
import {
  LOCALSTORAGE_KEY,
  A4_HEIGHT,
  A4_WIDTH,
} from "../utils/constants/editor.constants";
import type {
  IEditorElement,
  TVisibilityType,
} from "../utils/types/editor.types";
import type { TemplateType, VisibilityType } from "../api/types";
/* Иконки */
import {
  HelpCircle,
  Move,
  Save,
  ChevronLeft,
  Keyboard,
  MousePointer2,
} from "lucide-react";

/* ---------- компоненты ---------- */
import Canvas from "../components/editor/Canvas";
import CanvasToolbar from "../components/editor/CanvasToolbar";
import ElementsPanel from "../components/editor/ElementsPanel";
import PropertiesPanel from "../components/editor/PropertiesPanel";
import Modal from "../components/editor/documentation/Modal";

/* ---------- хуки ---------- */
import { useAutoZoom } from "../hooks/editorHooks/useAutoZoom";
import { useHistory } from "../hooks/editorHooks/useHistory";
import { useDragResize } from "../hooks/editorHooks/useDragResize";
import { useKeyboard } from "../hooks/editorHooks/useKeyboard";

/* ---------- утилиты ---------- */
import { generateId } from "../utils/help/generateID";
import { parseHtmlToElements } from "../utils/help/parseHtmlToElements";
import { snapToGrid } from "../utils/help/snapToGrid";
import { createDefaultElement } from "../utils/help/createDefaultElement";
import { generateDocx } from "../utils/help/generateDocx";
import { generatePdf } from "../utils/help/generatePDF";

export default function Editor() {
  const navigate = useNavigate();
  const location = useLocation();

  /* --- ПОЛУЧЕНИЕ ДАННЫХ ИЗ НАВИГАЦИИ --- */
  const state = location.state as any;
  const prefill = state?.prefillText as string | undefined;
  const importedElements = state?.importedElements as
    | IEditorElement[]
    | undefined;
  const importedTitle = state?.title as string | undefined;
  const templateToEdit = state?.templateToEdit as any | undefined;
  const editingTemplateId = state?.templateId as number | undefined;

  /* ---------- состояние ---------- */
  const [elements, setElements] = useState<IEditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Тип шаблона (PDF по умолчанию, так как это основной запрос)
  const [templateType, setTemplateType] = useState<TemplateType>("PDF");
  const [visibility, setVisibility] = useState<VisibilityType>("PUBLIC");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gridVisible, setGridVisible] = useState(true);
  const [gridStep, setGridStep] = useState(20);
  const [isDocOpen, setIsDocOpen] = useState(false);

  /* ---------- история ---------- */
  const { saveToHistory, undo, redo, canUndo, canRedo } = useHistory(elements);

  /* подпись: редактирование */
  const [isSigOpen, setIsSigOpen] = useState(false);
  const [sigEditId, setSigEditId] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigDrawing = useRef(false);

  /* ---------- зум ---------- */
  const canvasContainerRef = useRef<HTMLDivElement>(null!);
  const { zoom, autoZoom, isManualZoom, setZoom } =
    useAutoZoom(canvasContainerRef);

  /* ---------- helpers ---------- */
  const updateElement = useCallback(
    (id: string, upd: Partial<IEditorElement>) => {
      const next = elements.map((el) =>
        el.id === id ? { ...el, ...upd } : el,
      );
      setElements(next);
      saveToHistory(next);
    },
    [elements, saveToHistory],
  );

  const updateElementPosition = useCallback(
    (id: string, upd: Partial<IEditorElement>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...upd } : el)),
      );
    },
    [],
  );

  const updateProperties = useCallback(
    (id: string, props: any) => {
      const next = elements.map((el) =>
        el.id === id
          ? { ...el, properties: { ...el.properties, ...props } }
          : el,
      );
      setElements(next);
      saveToHistory(next);
    },
    [elements, saveToHistory],
  );

  const handleOpenSignatureEditor = (id: string) => {
    setSigEditId(id);
    setIsSigOpen(true);
    setTimeout(() => {
      const el = elements.find((i) => i.id === id);
      const props = (el?.properties || {}) as any;
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (props.image) {
        const img = new Image();
        img.onload = () =>
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = props.image;
      }
    }, 50);
  };

  const deleteElement = useCallback(
    (id: string) => {
      const next = elements.filter((el) => el.id !== id);
      setElements(next);
      saveToHistory(next);
      setSelectedId(null);
    },
    [elements, saveToHistory],
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
    [elements, saveToHistory],
  );

  /* ---------- drag/resize ---------- */
  const {
    isDragging,
    isResizing,
    startDrag,
    startResize,
    stopDragResize,
    handleMouseMove,
  } = useDragResize();

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

  /* ---------- экспорт DOCX ---------- */
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

  /* ---------- экспорт HTML ---------- */
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
        if (el.type === "signature") {
          const p = el.properties as any;
          if (p.image) {
            return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px"><img src="${p.image}" alt="signature" style="width:100%;height:100%;object-fit:contain"></div>`;
          }
          return `<div style="position:absolute;left:${el.x}px;top:${
            el.y
          }px;width:${el.width}px;height:${
            el.height
          }px;display:flex;align-items:center;justify-content:center"><span>${
            p.text || ""
          }</span></div>`;
        }
        if (el.type === "divider") {
          const p = el.properties as any;
          return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px"><hr style="border:none;border-top:${p.thickness}px ${p.style} ${p.color};margin:0;" /></div>`;
        }
        return "";
      })
      .join("")}</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    saveAs(blob, `${title || "template"}.html`);
  };

  /* ---------- экспорт PDF ---------- */
  const exportPdf = async () => {
    if (!elements.length) return setError("Нет элементов");
    setLoading(true);
    try {
      await generatePdf(elements, title);
    } catch (e: any) {
      setError("Ошибка PDF: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  /* ---------- СОХРАНЕНИЕ НА СЕРВЕР ---------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Введите название");
    if (!elements.length) return setError("Добавьте элементы");

    setLoading(true);
    try {
      // 1. Генерируем HTML представление (для PDF рендеринга на бэке)
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body>${elements
        .map((el) => {
          if (el.type === "text") {
            const { content } = el.properties as any;
            return `<div>${content || ""}</div>`;
          }
          if (el.type === "signature") {
            const p = el.properties as any;
            if (p.image) {
              return `<div><img src="${p.image}" alt="signature" style="max-width: 100%;" /></div>`;
            }
            return `<div>${p.text || ""}</div>`;
          }
          return `<div>${(el.properties as any).content || ""}</div>`;
        })
        .join("")}</body></html>`;

      // 2. Формируем тело запроса
      const payload = {
        title,
        description,
        visibility,
        template_type: templateType, // Выбранный формат (PDF/HTML/DOCX)

        // ВАЖНО: Отправляем элементы для сохранения в файл на бэкенде
        editor_content: elements,

        html_content: htmlContent,
        allowed_users: [],
      };

      if (editingTemplateId) {
        await templatesApi.update(editingTemplateId, payload);
      } else {
        await templatesApi.create(payload);
      }

      localStorage.removeItem(LOCALSTORAGE_KEY);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- useEffects (ЗАГРУЗКА ДАННЫХ) ---------- */
  useEffect(() => {
    /* 1. ПРИОРИТЕТ: Импорт из парсера (PDF/DOCX/HTML) */
    if (importedElements && importedElements.length > 0) {
      setElements(importedElements);
      saveToHistory(importedElements);
      if (importedTitle) setTitle(importedTitle);
      localStorage.removeItem(LOCALSTORAGE_KEY);
      return;
    }

    /* 2. ПРИОРИТЕТ: Редактирование существующего шаблона */
    if (templateToEdit) {
      const {
        html_content,
        editor_content, // Получаем данные из файла (JSON)
        title: tplTitle,
        description: tplDesc,
        visibility: tplVis,
        template_type: tplType,
      } = templateToEdit;

      setTitle(tplTitle || "");
      setDescription(tplDesc || "");
      setVisibility(tplVis || "PUBLIC");
      if (tplType) setTemplateType(tplType);

      // Если есть JSON-структура (из файла), используем её
      if (
        editor_content &&
        Array.isArray(editor_content) &&
        editor_content.length > 0
      ) {
        setElements(editor_content);
        saveToHistory(editor_content);
      }
      // Если файла нет (старый шаблон), пробуем парсить HTML
      else if (html_content) {
        try {
          const parsed = parseHtmlToElements(html_content as string);
          if (parsed && parsed.length) {
            setElements(parsed);
            saveToHistory(parsed);
          }
        } catch (e) {
          /* fallback */
        }
      }
      return;
    }

    /* 3. ПРИОРИТЕТ: Черновик из LocalStorage */
    const draft = localStorage.getItem(LOCALSTORAGE_KEY);
    if (draft) {
      try {
        const { elements: els, title: t, description: d } = JSON.parse(draft);
        if (els && els.length > 0) {
          setElements(els);
          setTitle(t || "");
          setDescription(d || "");
          saveToHistory(els);
          return;
        }
      } catch {}
    }

    /* 4. ПРИОРИТЕТ: Prefill (простой текст) */
    if (prefill) {
      const el = createDefaultElement("text", generateId(), snapToGrid);
      el.properties = { ...(el.properties as any), content: prefill };
      const next = [el];
      setElements(next);
      saveToHistory(next);
      setSelectedId(el.id);
    }
  }, []); // Выполняется один раз при монтировании

  /* Автосохранение черновика */
  useEffect(() => {
    const t = setInterval(() => {
      if (elements.length > 0) {
        localStorage.setItem(
          LOCALSTORAGE_KEY,
          JSON.stringify({ elements, title, description }),
        );
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [elements, title, description]);

  /* ---------- Обработчики ---------- */
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
    [elements, snapToGrid],
  );

  const saveSignatureFromModal = () => {
    if (!sigEditId || !sigCanvasRef.current) return;
    const data = sigCanvasRef.current.toDataURL("image/png");
    updateProperties(sigEditId, { image: data });
    setIsSigOpen(false);
    setSigEditId(null);
  };

  const handleUndo = () => {
    const res = undo();
    setElements(res);
    setSelectedId(null);
  };

  const handleRedo = () => {
    const res = redo();
    setElements(res);
    setSelectedId(null);
  };

  /* ---------- глобальный обработчик мыши ---------- */
  const canvasRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef(elements);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const node = canvasRef.current;
      if (!node) return;

      const currentSnap = e.shiftKey ? (v: number) => v : snapToGrid;

      handleMouseMove(
        e,
        node.getBoundingClientRect(),
        zoom,
        elementsRef.current,
        selectedId,
        updateElementPosition,
        currentSnap,
        gridStep,
      );
    };

    const onUp = () => {
      if (isDragging || isResizing) {
        saveToHistory(elementsRef.current);
      }
      stopDragResize();
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [
    isDragging,
    isResizing,
    selectedId,
    zoom,
    gridStep,
    handleMouseMove,
    updateElementPosition,
    saveToHistory,
    stopDragResize,
  ]);

  /* ---------- RENDER ---------- */
  return (
    <div className="layout-root">
      {/* 1. Навигация */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/dashboard" className="nav-brand">
            <ChevronLeft size={20} />
            Редактор шаблонов
          </a>
          <button
            className="btn btn-secondary"
            onClick={() => setIsDocOpen(true)}
          >
            <HelpCircle size={18} />
            Справка
          </button>
        </div>
      </nav>

      {/* 2. Область настроек шаблона */}
      <div className="container-1600 mb-6">
        <div className="surface template-meta-surface">
          <div className="settings-header flex gap-4">
            {/* Левая часть: Название и описание */}
            <div className="settings-main flex-grow">
              <input
                className="input-transparent-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название шаблона..."
              />
              <input
                className="input-transparent-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Добавить описание..."
              />
            </div>

            {/* Правая часть: Видимость и Кнопка */}
            <div className="settings-actions flex gap-3 items-center">
              {/* ВЫБОР ФОРМАТА (НОВОЕ) */}
              <div className="visibility-wrapper">
                <label
                  className="label mb-0"
                  style={{ fontSize: 11, color: "#666", marginBottom: 2 }}
                >
                  Формат
                </label>
                <select
                  className="select select-compact"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  style={{ minWidth: 100 }}
                >
                  <option value="PDF">PDF Документ</option>
                  <option value="HTML">Web (HTML)</option>
                  <option value="DOCX">Word (DOCX)</option>
                </select>
              </div>

              {/* ВЫБОР ДОСТУПА */}
              <div className="visibility-wrapper">
                <label
                  className="label mb-0"
                  style={{ fontSize: 11, color: "#666", marginBottom: 2 }}
                >
                  Доступ
                </label>
                <select
                  className="select select-compact"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as TVisibilityType)
                  }
                >
                  <option value="PUBLIC">Публичный</option>
                  <option value="RESTRICTED">Ограниченный</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
          {error && <div className="error-message mt-4 mb-0">{error}</div>}
        </div>
      </div>

      {/* 3. Основная рабочая область */}
      <div className="workspace-container container-1600">
        <div className="editor-grid">
          {/* Левая панель */}
          <div className="panel panel-left surface">
            <ElementsPanel
              onAdd={(type) => {
                const el = createDefaultElement(type, generateId(), snapToGrid);
                const next = [...elements, el];
                setElements(next);
                saveToHistory(next);
                setSelectedId(el.id);
                if (type === "signature") {
                  handleOpenSignatureEditor(el.id);
                }
              }}
              onImageUpload={handleImageUpload}
              gridVisible={gridVisible}
              onToggleGrid={setGridVisible}
              zoom={zoom}
              autoZoom={autoZoom}
              isManualZoom={isManualZoom}
              onZoomChange={(value: number, manual: boolean) =>
                setZoom(value, manual)
              }
            />
          </div>

          {/* Центральная панель */}
          <div className="panel panel-center surface" ref={canvasContainerRef}>
            <div className="canvas-toolbar-wrapper">
              <CanvasToolbar
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={() => {
                  if (confirm("Очистить холст?")) {
                    setElements([]);
                    saveToHistory([]);
                    setSelectedId(null);
                  }
                }}
                onExportDocx={exportDocx}
                onExportHtml={exportHtml}
                onExportPdf={exportPdf}
                gridVisible={gridVisible}
                gridStep={gridStep}
                onToggleGrid={setGridVisible}
                onGridStepChange={setGridStep}
              />
            </div>
            <div className="canvas-viewport">
              <Canvas
                ref={canvasRef}
                elements={elements}
                selectedId={selectedId}
                gridVisible={gridVisible}
                zoom={zoom}
                onSelect={setSelectedId}
                onElementMoveStart={(id, offsetX, offsetY) => {
                  startDrag(id, offsetX, offsetY);
                }}
                onElementResizeStart={(id, handle) => {
                  startResize(id, handle);
                }}
                onUpdateProp={updateProperties}
                onImageUpload={handleImageUpload}
                onEditSignature={handleOpenSignatureEditor}
              />
              {snapToGrid(0) !== 0 && (
                <div className="shift-hint badge badge-docx">
                  <Move size={12} />
                  Привязка к сетке
                </div>
              )}
            </div>
          </div>

          {/* Правая панель */}
          <div className="panel panel-right surface">
            <h3 className="h3 mb-4">Свойства</h3>
            <PropertiesPanel
              selected={elements.find((el) => el.id === selectedId) || null}
              onUpdateEl={updateElement}
              onUpdateProps={updateProperties}
              onDelete={deleteElement}
              onMoveLayer={moveLayer}
              onEditSignature={handleOpenSignatureEditor}
            />
          </div>
        </div>
      </div>

      {/* Модальное окно СПРАВКИ */}
      <Modal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
        title="Справка и горячие клавиши"
      >
        <div className="help-modal-content">
          <div className="help-section">
            <h4 className="help-title flex items-center gap-2">
              <Keyboard size={18} className="text-muted-ink" />
              Горячие клавиши
            </h4>
            <div className="hotkey-grid">
              <div className="hotkey-row">
                <span>Отменить действие</span>
                <div className="keys">
                  <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                </div>
              </div>
              <div className="hotkey-row">
                <span>Повторить действие</span>
                <div className="keys">
                  <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                </div>
              </div>
              <div className="hotkey-row">
                <span>Удалить элемент</span>
                <div className="keys">
                  <kbd>Delete</kbd>
                </div>
              </div>
              <div className="hotkey-row">
                <span>Копировать</span>
                <div className="keys">
                  <kbd>Ctrl</kbd> + <kbd>C</kbd>
                </div>
              </div>
              <div className="hotkey-row">
                <span>Вставить</span>
                <div className="keys">
                  <kbd>Ctrl</kbd> + <kbd>V</kbd>
                </div>
              </div>
              <div className="hotkey-row">
                <span>Перемещение</span>
                <div className="keys">
                  <kbd>Arrows</kbd>
                </div>
              </div>
            </div>
          </div>
          <div className="help-divider"></div>
          <div className="help-section">
            <h4 className="help-title flex items-center gap-2">
              <MousePointer2 size={18} className="text-muted-ink" />
              Управление мышью
            </h4>
            <ul className="help-list">
              <li>
                <strong>Выделение:</strong> Кликните по элементу для выбора.
              </li>
              <li>
                <strong>Перемещение:</strong> Зажмите ЛКМ и тяните элемент.
              </li>
              <li>
                <strong>Изменение размера:</strong> Тяните за синие маркеры по
                углам.
              </li>
              <li>
                <strong>Игнор. сетки:</strong> Зажмите <kbd>Shift</kbd> при
                перетаскивании для плавной доводки.
              </li>
            </ul>
          </div>
          <div className="flex justify-end mt-6">
            <button
              className="btn btn-primary"
              onClick={() => setIsDocOpen(false)}
            >
              Понятно
            </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно ПОДПИСИ */}
      <Modal
        isOpen={isSigOpen}
        onClose={() => {
          setIsSigOpen(false);
          setSigEditId(null);
        }}
        title="Редактор подписи"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="surface" style={{ padding: 8 }}>
            <canvas
              ref={sigCanvasRef}
              width={800}
              height={200}
              style={{
                width: "100%",
                height: 200,
                background: "#fff",
                touchAction: "none",
                cursor: "crosshair",
                borderRadius: 4,
                border: "1px dashed #ccc",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                sigDrawing.current = true;
                const c = sigCanvasRef.current;
                if (!c) return;
                const rect = c.getBoundingClientRect();
                const scaleX = c.width / rect.width || 1;
                const scaleY = c.height / rect.height || 1;

                const ctx = c.getContext("2d");
                if (!ctx) return;
                ctx.beginPath();
                ctx.moveTo(
                  (e.clientX - rect.left) * scaleX,
                  (e.clientY - rect.top) * scaleY,
                );
              }}
              onMouseMove={(e) => {
                if (!sigDrawing.current) return;
                const c = sigCanvasRef.current;
                if (!c) return;
                const rect = c.getBoundingClientRect();
                const scaleX = c.width / rect.width || 1;
                const scaleY = c.height / rect.height || 1;

                const ctx = c.getContext("2d");
                if (!ctx) return;
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                ctx.strokeStyle = "#000";
                ctx.lineTo(
                  (e.clientX - rect.left) * scaleX,
                  (e.clientY - rect.top) * scaleY,
                );
                ctx.stroke();
              }}
              onMouseUp={() => (sigDrawing.current = false)}
              onMouseLeave={() => (sigDrawing.current = false)}
            />
          </div>
          <div className="flex gap-2" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const canvas = sigCanvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  if (ctx) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                  }
                }
              }}
            >
              Очистить
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsSigOpen(false);
                setSigEditId(null);
              }}
            >
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={saveSignatureFromModal}
            >
              Сохранить
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        /* --- ПЕРЕМЕННЫЕ ДИЗАЙН СИСТЕМЫ --- */
        :root {
          --c-bg-100: #f7f8f8;
          --c-bg-200: #f1f3f4;
          --c-bg-300: #e3e6e8;
          --c-ink-800: #2f3235;
          --c-ink-900: #26292a;
          --c-accent: #e73f0c;
          --radius-sm: 6px;
          --radius-md: 10px;
          --shadow-sm: 0 2px 8px rgba(38, 41, 42, 0.07);
          --shadow-md: 0 6px 18px rgba(38, 41, 42, 0.1);
          --border: 1px solid rgba(47, 50, 53, 0.08);
          --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
          --c-grid-color: rgba(0, 0, 0, 0.06);

          --fs-1: clamp(22px, 2.6vw, 32px);
          --fs-2: clamp(18px, 2vw, 24px);
          --fs-3: 18px;
          --fs-4: 16px;
          --fs-5: 14px;

          --sp-0: 0;
          --sp-1: 4px;
          --sp-2: 8px;
          --sp-3: 12px;
          --sp-4: 16px;
          --sp-5: 20px;
          --sp-6: 24px;
          --sp-7: 32px;
          --sp-8: 40px;

          --ring: 0 0 0 0.18rem rgba(231, 63, 12, 0.18);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --c-bg-100: #2f3235;
            --c-bg-200: #26292a;
            --c-bg-300: #424649;
            --c-ink-800: #f4f4f4;
            --c-ink-900: #dee1e2;
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
            --shadow-md: 0 10px 24px rgba(0, 0, 0, 0.45);
          }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font-sans); background: var(--c-bg-200); color: var(--c-ink-800); line-height: 1.5; min-height: 100vh; }
        
        .container-1600 { max-width: 1600px; margin: 0 auto; padding: 0 var(--sp-4) var(--sp-6); }
        .surface { background: var(--c-bg-100); border: var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); }
        .text-muted-ink { color: #6c757d; }

        h1, .h1 { font-size: var(--fs-1); font-weight: 700; color: var(--c-ink-800); }
        h2, .h2 { font-size: var(--fs-2); font-weight: 700; color: var(--c-ink-800); }
        h3, .h3 { font-size: var(--fs-3); font-weight: 600; color: var(--c-ink-800); }

        .btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2); padding: var(--sp-3) var(--sp-5); border-radius: var(--radius-sm); font-size: var(--fs-5); font-weight: 500; cursor: pointer; transition: all 0.16s ease; border: none; text-decoration: none; }
        .btn:focus { outline: none; box-shadow: var(--ring); }
        .btn-primary { background: var(--c-accent); color: white; }
        .btn-primary:hover { background: #c93509; }
        .btn-secondary { background: var(--c-bg-100); color: var(--c-ink-800); border: var(--border); }
        .btn-secondary:hover { background: var(--c-bg-200); }
        .btn-ghost { background: transparent; color: var(--c-ink-800); }
        .btn-ghost:hover { background: var(--c-bg-200); }
        .btn-sm { padding: 4px 8px; font-size: 13px; }
        .btn-lg { padding: 12px 24px; font-size: 16px; font-weight: 600; }

        .input, .select, .textarea { width: 100%; padding: var(--sp-3) var(--sp-4); border: var(--border); border-radius: var(--radius-sm); font-size: var(--fs-4); background: var(--c-bg-100); color: var(--c-ink-800); transition: border-color 0.16s ease, box-shadow 0.16s ease; }
        .input:focus, .select:focus, .textarea:focus { outline: none; box-shadow: var(--ring); border-color: var(--c-accent); }
        
        .label { display: block; font-size: var(--fs-5); font-weight: 500; margin-bottom: var(--sp-2); color: var(--c-ink-800); }
        .form-group { margin-bottom: var(--sp-5); }
        .mb-0 { margin-bottom: 0 !important; }

        .grid { display: grid; gap: var(--sp-5); }
        .grid-2 { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        
        .flex { display: flex; }
        .items-center { align-items: center; }
        .flex-grow { flex-grow: 1; }
        .gap-2 { gap: var(--sp-2); }
        .gap-3 { gap: var(--sp-3); }
        .gap-4 { gap: var(--sp-4); }
        .justify-end { justify-content: flex-end; }
        
        .mt-4 { margin-top: var(--sp-4); }
        .mb-4 { margin-bottom: var(--sp-4); }
        .mb-6 { margin-bottom: var(--sp-6); }

        .badge { display: inline-flex; align-items: center; gap: var(--sp-1); padding: var(--sp-1) var(--sp-3); border-radius: var(--radius-sm); font-size: 12px; font-weight: 500; background: var(--c-bg-200); color: var(--c-ink-800); }
        .badge-docx { background: rgba(139, 92, 246, 0.1); color: #7c3aed; }

        .nav { background: var(--c-bg-100); border-bottom: var(--border); padding: var(--sp-4) var(--sp-6); margin-bottom: var(--sp-6); }
        .nav-inner { max-width: 1600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .nav-brand { font-size: var(--fs-3); font-weight: 700; color: var(--c-ink-800); text-decoration: none; display: flex; align-items: center; gap: var(--sp-2); }

        .error-message { background: rgba(239, 68, 68, 0.1); color: #dc2626; padding: var(--sp-4); border-radius: var(--radius-sm); margin-bottom: var(--sp-4); }

        /* --- STYLES FOR UPDATED SETTINGS HEADER --- */
        .input-transparent-title {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 24px;
          font-weight: 700;
          color: var(--c-ink-800);
          outline: none;
          padding: 0;
          margin-bottom: 4px;
        }
        .input-transparent-title:focus { opacity: 0.8; }
        .input-transparent-title::placeholder { color: var(--c-ink-400); opacity: 0.5; }
        
        .input-transparent-desc {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 15px;
          color: var(--c-ink-600);
          outline: none;
          padding: 0;
        }
        
        .select-compact { 
           padding-top: 10px;
           padding-bottom: 10px;
        }

        /* --- STYLES FOR HELP MODAL --- */
        .help-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: var(--c-ink-800); }
        .hotkey-grid { display: grid; gap: 8px; }
        .hotkey-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--c-bg-200); }
        .hotkey-row:last-child { border: none; }
        .hotkey-row span { font-size: 14px; color: var(--c-ink-600); }
        
        kbd {
          background-color: var(--c-bg-200);
          border: 1px solid var(--c-bg-300);
          border-radius: 4px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.05);
          color: var(--c-ink-800);
          display: inline-block;
          font-family: monospace;
          font-size: 0.85em;
          font-weight: 600;
          line-height: 1;
          padding: 3px 6px;
          white-space: nowrap;
        }

        .element-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }
        
        .help-list { list-style: none; padding: 0; }
        .help-list li { margin-bottom: 8px; font-size: 14px; color: var(--c-ink-600); position: relative; padding-left: 14px; }
        .help-list li::before { content: "•"; color: var(--c-accent); position: absolute; left: 0; font-weight: bold; }
        
        .help-divider { height: 1px; background: var(--border); margin: 24px 0; }

        /* --- EDITOR SPECIFIC LAYOUT --- */
        .layout-root { display: flex; flex-direction: column; min-height: 100vh; }
        .template-meta-surface { padding: var(--sp-6); width: 100%;  }
        
        .workspace-container { flex: 1; display: flex; flex-direction: column; min-height: 0; padding-bottom: var(--sp-6); }
        .editor-grid { display: grid; grid-template-columns: 260px 1fr 300px; gap: var(--sp-4); height: 100%; min-height: 600px; }
        
        .panel { padding: var(--sp-4); display: flex; flex-direction: column; gap: 10px; overflow-y: auto; max-height: calc(100vh - 250px); }
        .panel-center { background: var(--c-bg-200);  padding: 0; overflow: hidden; position: relative; }
        
        .canvas-toolbar-wrapper { padding: var(--sp-3); background: var(--c-bg-100); border-bottom: var(--border); z-index: 10; }
        .canvas-viewport { flex: 1; overflow: auto; padding: var(--sp-8); display: flex; align-items: flex-start; justify-content: center; position: relative; background: var(--c-bg-200); }
        
        .shift-hint { position: absolute; bottom: var(--sp-4); left: 50%; transform: translateX(-50%); z-index: 20; box-shadow: var(--shadow-sm); background: var(--c-bg-100); }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .editor-grid { grid-template-columns: 220px 1fr 260px; gap: var(--sp-3); }
          .container-1600 { padding: 0 var(--sp-3) var(--sp-4); }
        }
        @media (max-width: 1024px) {
          .editor-grid { display: flex; flex-direction: column; gap: var(--sp-5); height: auto; }
          .panel { max-height: none; overflow: visible; }
          .panel-center { order: 1; height: 600px; }
          .panel-left { order: 2;  }
          .panel-right { order: 3; }
          .settings-header { flex-direction: column; align-items: stretch; }
          .settings-actions { justify-content: space-between; margin-top: 10px; }
        }
      `}</style>
    </div>
  );
}
