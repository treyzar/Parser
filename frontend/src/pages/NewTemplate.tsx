import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import {
  FileText,
  Image,
  Table as TableIcon,
  Calendar,
  Signature,
  Minus,
  ArrowDown,
  ArrowUp,
  Trash2,
  Undo2,
  Redo2,
  Download,
  FileDown,
  Save,
  Settings,
  Plus,
  MousePointer,
  Eye,
  EyeOff,
  HelpCircle,
  Move,
  CornerDownRight,
  Layers,
  Type,
  Palette,
  Grid3x3,
  Upload,
  File,
  Search,
  PlusCircle,
  EyeIcon,
  Lock,
  Globe,
  ArrowLeft,
  Loader2,
  X,
  Copy,
  Clipboard,
  BookOpen,
  Keyboard,
  ImageIcon,
  Files,
} from "lucide-react";

// ======== ТИПЫ ========
type TemplateType = "HTML" | "DOCX";
type VisibilityType = "PUBLIC" | "RESTRICTED";
type DocSection =
  | "hotkeys"
  | "elements"
  | "work"
  | "tables"
  | "export"
  | "copy";

interface TextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: "left" | "center" | "right";
}

interface ImageProperties {
  src: string;
  alt: string;
  file?: File;
}

interface TableProperties {
  rows: number;
  cols: number;
  borderWidth: number;
  borderColor: string;
  cellBg: string;
  data: string[][];
}

interface DateProperties {
  format: string;
  value: string;
}

interface SignatureProperties {
  text: string;
  fontSize: number;
  color: string;
}

interface DividerProperties {
  thickness: number;
  color: string;
  style: "solid" | "dashed" | "dotted";
}

type ElementProperties =
  | TextProperties
  | ImageProperties
  | TableProperties
  | DateProperties
  | SignatureProperties
  | DividerProperties;

interface EditorElement {
  id: string;
  type: "text" | "image" | "table" | "date" | "signature" | "divider";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  properties: ElementProperties;
}

interface HistoryState {
  elements: EditorElement[];
  timestamp: number;
}

// ======== КОНСТАНТЫ ========
const GRID_SIZE = 20;
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const LOCALSTORAGE_KEY = "editor_draft";
const MIN_WIDTH = 50;
const MIN_HEIGHT = 30;
const MAX_HISTORY_STEPS = 50;

// ======== КОМПОНЕНТ МОДАЛКИ ========
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Блокировка прокрутки фона
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// ======== РАЗДЕЛЬНАЯ ДОКУМЕНТАЦИЯ ========
const DetailedDocumentation: React.FC<{ section: DocSection }> = ({
  section,
}) => {
  switch (section) {
    case "hotkeys":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <Keyboard size={18} />
            Горячие клавиши
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <kbd className="kbd">Ctrl+Z</kbd>
              <span>Отменить последнее действие</span>
            </li>
            <li className="doc-item">
              <kbd className="kbd">Ctrl+Y</kbd>
              <span>Повторить отмененное действие</span>
            </li>
            <li className="doc-item">
              <kbd className="kbd">Delete</kbd>
              <span>Удалить выбранный элемент</span>
            </li>
            <li className="doc-item">
              <kbd className="kbd">Shift</kbd>
              <span>Временно включить привязку к сетке (удерживайте)</span>
            </li>
            <li className="doc-item">
              <kbd className="kbd">Ctrl+C</kbd>
              <span>Скопировать выбранный элемент в буфер обмена</span>
            </li>
            <li className="doc-item">
              <kbd className="kbd">Ctrl+V</kbd>
              <span>Вставить скопированный элемент на холст</span>
            </li>
          </ul>
          <p className="doc-text">
            Горячие клавиши работают только когда фокус находится на холсте
            редактора.
          </p>
        </div>
      );
    case "elements":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <PlusCircle size={18} />
            Добавление элементов
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <strong>Текст:</strong> Добавляет текстовый блок с возможностью
              форматирования
            </li>
            <li className="doc-item">
              <strong>Изображение:</strong> Добавляет блок для изображения (URL
              или загрузка файла)
            </li>
            <li className="doc-item">
              <strong>Таблица:</strong> Создает таблицу с редактируемыми
              ячейками
            </li>
            <li className="doc-item">
              <strong>Дата:</strong> Поле ввода даты с календарем
            </li>
            <li className="doc-item">
              <strong>Подпись:</strong> Линия для подписи с текстом
            </li>
            <li className="doc-item">
              <strong>Разделитель:</strong> Горизонтальная линия для разделения
              контента
            </li>
          </ul>
          <p className="doc-text">
            Также можно перетащить файл изображения прямо на холст для быстрого
            добавления.
          </p>
        </div>
      );
    case "work":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <MousePointer size={18} />
            Работа с элементами
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <strong>Выбор:</strong> Кликните на элемент для выбора (появится
              рамка)
            </li>
            <li className="doc-item">
              <strong>Перемещение:</strong> Перетащите элемент за любую область
            </li>
            <li className="doc-item">
              <strong>Изменение размера:</strong> Используйте угловые маркеры
            </li>
            <li className="doc-item">
              <strong>Привязка к сетке:</strong> Удерживайте Shift при
              перемещении/изменении размера
            </li>
            <li className="doc-item">
              <strong>Удаление:</strong> Нажмите Delete или кнопку "Удалить
              элемент"
            </li>
            <li className="doc-item">
              <strong>Слои:</strong> Используйте "На передний/задний план" для
              изменения порядка
            </li>
          </ul>
        </div>
      );
    case "tables":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <TableIcon size={18} />
            Работа с таблицами
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <strong>Редактирование ячеек:</strong> Кликните дважды по ячейке и
              начните вводить текст
            </li>
            <li className="doc-item">
              <strong>Изменение размера:</strong> Измените размеры таблицы в
              панели свойств
            </li>
            <li className="doc-item">
              <strong>Строки и столбцы:</strong> Используйте ползунки для
              добавления/удаления
            </li>
            <li className="doc-item">
              <strong>Цвет границ:</strong> Можно изменить цвет и толщину границ
            </li>
          </ul>
          <p className="doc-text">
            Данные таблицы сохраняются при экспорте в DOCX и HTML.
          </p>
        </div>
      );
    case "export":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <Download size={18} />
            Экспорт документов
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <strong>DOCX:</strong> Экспорт в формат Word с сохранением
              форматирования и таблиц
            </li>
            <li className="doc-item">
              <strong>HTML:</strong> Экспорт для веб-страниц с абсолютным
              позиционированием
            </li>
            <li className="doc-item">
              <strong>Сохранение:</strong> Автосохранение черновика каждые 30
              секунд
            </li>
          </ul>
          <p className="doc-text">
            При экспорте в DOCX все элементы конвертируются в соответствующие
            элементы Word.
          </p>
        </div>
      );
    case "copy":
      return (
        <div className="doc-content">
          <h4 className="doc-heading">
            <Copy size={18} />
            Копирование и вставка
          </h4>
          <ul className="doc-list">
            <li className="doc-item">
              <strong>Копирование:</strong> Выберите элемент и нажмите Ctrl+C
            </li>
            <li className="doc-item">
              <strong>Вставка:</strong> Нажмите Ctrl+V для вставки
              скопированного элемента
            </li>
            <li className="doc-item">
              <strong>Кнопка:</strong> Также можно использовать кнопку
              "Копировать элемент"
            </li>
          </ul>
          <p className="doc-text">
            Копируются все свойства элемента, включая положение, размер и стили.
          </p>
        </div>
      );
  }
};

// ======== ГЛАВНАЯ ПАНЕЛЬ ДОКУМЕНТАЦИИ С НАВИГАЦИЕЙ ========
const DocumentationPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<DocSection>("hotkeys");

  const navItems = [
    { id: "hotkeys", label: "Горячие клавиши", icon: <Keyboard size={16} /> },
    { id: "elements", label: "Элементы", icon: <PlusCircle size={16} /> },
    {
      id: "work",
      label: "Работа с элементами",
      icon: <MousePointer size={16} />,
    },
    { id: "tables", label: "Таблицы", icon: <TableIcon size={16} /> },
    { id: "export", label: "Экспорт", icon: <Download size={16} /> },
    { id: "copy", label: "Копирование", icon: <Copy size={16} /> },
  ] as const;

  return (
    <div className="documentation-panel">
      <div className="doc-navigation">
        {navItems.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`doc-nav-item ${activeSection === id ? "active" : ""}`}
            onClick={() => setActiveSection(id as DocSection)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="doc-content-wrapper">
        {/* КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: добавляем key для принудительного перерисовки */}
        <DetailedDocumentation key={activeSection} section={activeSection} />
      </div>
    </div>
  );
};

// ======== ПАНЕЛЬ ЭЛЕМЕНТОВ ========
interface ElementsPanelProps {
  onAddElement: (type: EditorElement["type"]) => void;
  onImageUpload: (file: File) => void;
  gridVisible: boolean;
  onToggleGrid: (visible: boolean) => void;
  zoom: number;
  autoZoom: number;
  isManualZoom: boolean;
  onZoomChange: (zoom: number, isManual: boolean) => void;
}

const ElementsPanel: React.FC<ElementsPanelProps> = ({
  onAddElement,
  onImageUpload,
  gridVisible,
  onToggleGrid,
  zoom,
  autoZoom,
  isManualZoom,
  onZoomChange,
}) => {
  const currentZoom = isManualZoom ? zoom : autoZoom;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const elementButtons = [
    { type: "text", icon: <FileText size={18} />, label: "Текст" },
    { type: "image", icon: <Image size={18} />, label: "Изображение" },
    { type: "table", icon: <TableIcon size={18} />, label: "Таблица" },
    { type: "date", icon: <Calendar size={18} />, label: "Дата" },
    { type: "signature", icon: <Signature size={18} />, label: "Подпись" },
    { type: "divider", icon: <Minus size={18} />, label: "Разделитель" },
  ] as const;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file);
    }
  };

  return (
    <div className="panel">
      <h3 className="panel-title">
        <Plus size={16} />
        Элементы
      </h3>

      <div className="element-buttons">
        {elementButtons.map(({ type, icon, label }) => (
          <button
            key={type}
            className="btn btn-secondary btn-full"
            onClick={() => onAddElement(type as EditorElement["type"])}
          >
            <span className="btn-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="panel-section">
        <label className="label">Загрузить изображение</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <button
          className="btn btn-secondary btn-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} />
          Выбрать файл
        </button>
      </div>

      <div className="panel-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={(e) => onToggleGrid(e.target.checked)}
          />
          <Grid3x3 size={14} />
          <span>Показывать сетку</span>
        </label>
      </div>

      <div className="panel-section">
        <div className="flex-between mb-2">
          <label className="label">Масштаб</label>
          <span className="badge">{Math.round(currentZoom * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={currentZoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value), true)}
          className="input-range"
        />
        {isManualZoom && (
          <button
            className="btn btn-ghost btn-full mt-2"
            onClick={() => onZoomChange(autoZoom, false)}
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
};

// ======== ПАНЕЛЬ СВОЙСТВ ========
interface PropertiesPanelProps {
  selectedElement: EditorElement | null;
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
  onUpdateProperties: (
    id: string,
    properties: Partial<ElementProperties>
  ) => void;
  onDeleteElement: (id: string) => void;
  onMoveLayer: (id: string, direction: "front" | "back") => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onUpdateProperties,
  onDeleteElement,
  onMoveLayer,
}) => {
  if (!selectedElement) {
    return (
      <div className="properties-placeholder">
        <div className="placeholder-icon">
          <MousePointer size={24} />
        </div>
        <h3 className="h3 mb-2">Выберите элемент</h3>
        <p className="text-muted-ink">
          Нажмите на любой элемент на холсте, чтобы настроить его свойства
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">
        <Settings size={16} />
        Настройки
      </h3>

      <div className="properties-grid">
        <div className="form-group">
          <label className="label">Позиция X</label>
          <input
            type="number"
            className="input"
            value={selectedElement.x}
            onChange={(e) =>
              onUpdateElement(selectedElement.id, {
                x: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="label">Позиция Y</label>
          <input
            type="number"
            className="input"
            value={selectedElement.y}
            onChange={(e) =>
              onUpdateElement(selectedElement.id, {
                y: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="label">Ширина</label>
          <input
            type="number"
            className="input"
            value={selectedElement.width}
            onChange={(e) =>
              onUpdateElement(selectedElement.id, {
                width: Math.max(
                  MIN_WIDTH,
                  parseInt(e.target.value) || MIN_WIDTH
                ),
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="label">Высота</label>
          <input
            type="number"
            className="input"
            value={selectedElement.height}
            onChange={(e) =>
              onUpdateElement(selectedElement.id, {
                height: Math.max(
                  MIN_HEIGHT,
                  parseInt(e.target.value) || MIN_HEIGHT
                ),
              })
            }
          />
        </div>
      </div>

      {selectedElement.type === "text" && (
        <div className="properties-section">
          <div className="form-group">
            <label className="label">
              <Type size={14} />
              Текст
            </label>
            <textarea
              className="input textarea"
              value={(selectedElement.properties as TextProperties).content}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  content: e.target.value,
                } as Partial<TextProperties>)
              }
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="label">Шрифт</label>
            <select
              className="select"
              value={(selectedElement.properties as TextProperties).fontFamily}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  fontFamily: e.target.value,
                } as Partial<TextProperties>)
              }
            >
              <option value="Inter">Inter</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">
              Размер шрифта:{" "}
              {(selectedElement.properties as TextProperties).fontSize}px
            </label>
            <input
              type="range"
              min="8"
              max="72"
              value={(selectedElement.properties as TextProperties).fontSize}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  fontSize: parseInt(e.target.value),
                } as Partial<TextProperties>)
              }
              className="input-range"
            />
          </div>

          <div className="form-group">
            <label className="label">
              <Palette size={14} />
              Цвет текста
            </label>
            <input
              type="color"
              className="input"
              value={(selectedElement.properties as TextProperties).color}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  color: e.target.value,
                } as Partial<TextProperties>)
              }
            />
          </div>

          <div className="checkbox-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={(selectedElement.properties as TextProperties).bold}
                onChange={(e) =>
                  onUpdateProperties(selectedElement.id, {
                    bold: e.target.checked,
                  } as Partial<TextProperties>)
                }
              />
              <span>Жирный</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={(selectedElement.properties as TextProperties).italic}
                onChange={(e) =>
                  onUpdateProperties(selectedElement.id, {
                    italic: e.target.checked,
                  } as Partial<TextProperties>)
                }
              />
              <span>Курсив</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={
                  (selectedElement.properties as TextProperties).underline
                }
                onChange={(e) =>
                  onUpdateProperties(selectedElement.id, {
                    underline: e.target.checked,
                  } as Partial<TextProperties>)
                }
              />
              <span>Подчеркнутый</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={
                  (selectedElement.properties as TextProperties).align ===
                  "center"
                }
                onChange={(e) =>
                  onUpdateProperties(selectedElement.id, {
                    align: e.target.checked ? "center" : "left",
                  } as Partial<TextProperties>)
                }
              />
              <span>По центру</span>
            </label>
          </div>
        </div>
      )}

      {selectedElement.type === "image" && (
        <div className="properties-section">
          <div className="form-group">
            <label className="label">
              <Upload size={14} />
              URL изображения
            </label>
            <input
              type="text"
              className="input"
              value={(selectedElement.properties as ImageProperties).src}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  src: e.target.value,
                } as Partial<ImageProperties>)
              }
              placeholder="https://example.com/image.jpg"
            />
            <small className="input-hint">
              Поддерживаются URL или data URI
            </small>
          </div>
        </div>
      )}

      {selectedElement.type === "table" && (
        <div className="properties-section">
          <div className="form-group">
            <label className="label">
              <TableIcon size={14} />
              Строки: {(selectedElement.properties as TableProperties).rows}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={(selectedElement.properties as TableProperties).rows}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  rows: parseInt(e.target.value),
                } as Partial<TableProperties>)
              }
              className="input-range"
            />
          </div>
          <div className="form-group">
            <label className="label">
              Столбцы: {(selectedElement.properties as TableProperties).cols}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={(selectedElement.properties as TableProperties).cols}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  cols: parseInt(e.target.value),
                } as Partial<TableProperties>)
              }
              className="input-range"
            />
          </div>
          <div className="form-group">
            <label className="label">Цвет границ</label>
            <input
              type="color"
              className="input"
              value={
                (selectedElement.properties as TableProperties).borderColor
              }
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  borderColor: e.target.value,
                } as Partial<TableProperties>)
              }
            />
          </div>
          <div className="form-group">
            <label className="label">Редактирование</label>
            <small className="input-hint">
              Двойной клик по ячейке таблицы на холсте для редактирования
            </small>
          </div>
        </div>
      )}

      {selectedElement.type === "signature" && (
        <div className="properties-section">
          <div className="form-group">
            <label className="label">
              <Signature size={14} />
              Текст подписи
            </label>
            <input
              type="text"
              className="input"
              value={(selectedElement.properties as SignatureProperties).text}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  text: e.target.value,
                } as Partial<SignatureProperties>)
              }
            />
          </div>
        </div>
      )}

      {selectedElement.type === "divider" && (
        <div className="properties-section">
          <div className="form-group">
            <label className="label">
              <Minus size={14} />
              Толщина:{" "}
              {(selectedElement.properties as DividerProperties).thickness}px
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={
                (selectedElement.properties as DividerProperties).thickness
              }
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  thickness: parseInt(e.target.value),
                } as Partial<DividerProperties>)
              }
              className="input-range"
            />
          </div>
          <div className="form-group">
            <label className="label">Стиль линии</label>
            <select
              className="select"
              value={(selectedElement.properties as DividerProperties).style}
              onChange={(e) =>
                onUpdateProperties(selectedElement.id, {
                  style: e.target.value as "solid" | "dashed" | "dotted",
                } as Partial<DividerProperties>)
              }
            >
              <option value="solid">Сплошная</option>
              <option value="dashed">Пунктирная</option>
              <option value="dotted">Точечная</option>
            </select>
          </div>
        </div>
      )}

      <div className="properties-section">
        <button
          className="btn btn-secondary btn-full mb-3"
          onClick={() => onMoveLayer(selectedElement.id, "back")}
        >
          <ArrowDown size={14} />
          На задний план
        </button>
        <button
          className="btn btn-secondary btn-full mb-3"
          onClick={() => onMoveLayer(selectedElement.id, "front")}
        >
          <ArrowUp size={14} />
          На передний план
        </button>
        <button
          className="btn btn-danger btn-full mb-3"
          onClick={() => onDeleteElement(selectedElement.id)}
        >
          <Trash2 size={14} />
          Удалить элемент
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() => {
            navigator.clipboard
              .writeText(JSON.stringify(selectedElement))
              .then(() => {
                alert("Элемент скопирован!");
              });
          }}
        >
          <Copy size={14} />
          Копировать элемент
        </button>
      </div>
    </div>
  );
};

// ======== ГЛАВНЫЙ КОМПОНЕНТ ========
export default function Editor() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Состояние редактора
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("HTML");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<VisibilityType>("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [autoZoom, setAutoZoom] = useState(1);
  const [isManualZoom, setIsManualZoom] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [copiedElement, setCopiedElement] = useState<EditorElement | null>(
    null
  );

  // История изменений
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Выбранный элемент
  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  // Адаптивное масштабирование
  useEffect(() => {
    const updateZoom = () => {
      if (canvasContainerRef.current) {
        const containerWidth = canvasContainerRef.current.clientWidth - 32;
        const newZoom = Math.min(1, containerWidth / A4_WIDTH);
        setAutoZoom(newZoom);
        if (!isManualZoom) {
          setZoom(newZoom);
        }
      }
    };

    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, [isManualZoom]);

  // Отслеживание Shift для привязки к сетке
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Загрузка черновика
  useEffect(() => {
    const draft = localStorage.getItem(LOCALSTORAGE_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft) as {
          elements: EditorElement[];
          title: string;
          description: string;
        };
        const loadedElements = data.elements || [];
        setElements(loadedElements);
        setTitle(data.title || "");
        setDescription(data.description || "");

        const initialState: HistoryState = {
          elements: JSON.parse(JSON.stringify(loadedElements)),
          timestamp: Date.now(),
        };
        setHistory([initialState]);
        setHistoryIndex(0);
      } catch (e) {
        console.error("Failed to load draft:", e);
        const initialState: HistoryState = {
          elements: [],
          timestamp: Date.now(),
        };
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    } else {
      const initialState: HistoryState = {
        elements: [],
        timestamp: Date.now(),
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Автосохранение
  useEffect(() => {
    const interval = setInterval(() => {
      const draft = {
        elements,
        title,
        description,
        timestamp: Date.now(),
      };
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(draft));
    }, 30000);
    return () => clearInterval(interval);
  }, [elements, title, description]);

  // Сохранение в историю
  const saveToHistory = useCallback(
    (newElements: EditorElement[]) => {
      const newState: HistoryState = {
        elements: JSON.parse(JSON.stringify(newElements)),
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const newHistory = [...sliced, newState];
        if (newHistory.length > MAX_HISTORY_STEPS) {
          return newHistory.slice(-MAX_HISTORY_STEPS);
        }
        return newHistory;
      });

      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        const totalSteps = Math.min(historyIndex + 2, MAX_HISTORY_STEPS);
        return Math.min(newIndex, totalSteps - 1);
      });
    },
    [historyIndex]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  // Привязка к сетке (только при зажатом Shift)
  const snapToGrid = useCallback(
    (value: number) => {
      if (!isShiftPressed) return value;
      return Math.round(value / GRID_SIZE) * GRID_SIZE;
    },
    [isShiftPressed]
  );

  const generateId = useCallback(() => {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Загрузка изображения
  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        const newElement: EditorElement = {
          id: generateId(),
          type: "image",
          x: snapToGrid(A4_WIDTH / 2 - 125),
          y: snapToGrid(A4_HEIGHT / 2 - 100),
          width: 250,
          height: 200,
          zIndex: elements.length,
          properties: {
            src,
            alt: file.name,
            file,
          } as ImageProperties,
        };

        const newElements = [...elements, newElement];
        setElements(newElements);
        saveToHistory(newElements);
        setSelectedId(newElement.id);
      };
      reader.readAsDataURL(file);
    },
    [elements, generateId, saveToHistory, snapToGrid]
  );

  // Добавление элемента
  const addElement = useCallback(
    (type: EditorElement["type"]) => {
      const newElement: EditorElement = {
        id: generateId(),
        type,
        x: snapToGrid(A4_WIDTH / 2 - 150),
        y: snapToGrid(A4_HEIGHT / 2 - 100),
        width:
          type === "text"
            ? 300
            : type === "image"
            ? 250
            : type === "table"
            ? 400
            : 150,
        height:
          type === "text"
            ? 80
            : type === "image"
            ? 200
            : type === "table"
            ? 200
            : 40,
        zIndex: elements.length,
        properties: getDefaultProperties(type),
      };

      const newElements = [...elements, newElement];
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedId(newElement.id);
    },
    [elements, generateId, saveToHistory, snapToGrid]
  );

  const getDefaultProperties = (
    type: EditorElement["type"]
  ): ElementProperties => {
    if (type === "text")
      return {
        content: "Новый текст",
        fontFamily: "Inter",
        fontSize: 14,
        color: "#1a1a1a",
        bold: false,
        italic: false,
        underline: false,
        align: "left",
      };
    if (type === "image") return { src: "", alt: "Image" };
    if (type === "table")
      return {
        rows: 3,
        cols: 3,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        cellBg: "transparent",
        data: Array(3)
          .fill(null)
          .map(() => Array(3).fill("")),
      };
    if (type === "date")
      return {
        format: "DD.MM.YYYY",
        value: new Date().toISOString().split("T")[0],
      };
    if (type === "signature")
      return { text: "Подпись", fontSize: 16, color: "#1a1a1a" };
    if (type === "divider")
      return { thickness: 1, color: "#1a1a1a", style: "solid" };
    return {} as ElementProperties;
  };

  const updateElement = useCallback(
    (id: string, updates: Partial<EditorElement>) => {
      const newElements = elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      );
      setElements(newElements);
      saveToHistory(newElements);
    },
    [elements, saveToHistory]
  );

  const updateProperties = useCallback(
    (id: string, properties: Partial<ElementProperties>) => {
      const newElements = elements.map((el) =>
        el.id === id
          ? { ...el, properties: { ...el.properties, ...properties } }
          : el
      );
      setElements(newElements);
      saveToHistory(newElements);
    },
    [elements, saveToHistory]
  );

  const deleteElement = useCallback(
    (id: string) => {
      const newElements = elements.filter((el) => el.id !== id);
      setElements(newElements);
      saveToHistory(newElements);
      setSelectedId(null);
    },
    [elements, saveToHistory]
  );

  const moveLayer = useCallback(
    (id: string, direction: "front" | "back") => {
      const elementIndex = elements.findIndex((el) => el.id === id);
      if (elementIndex === -1) return;

      const newElements = [...elements];
      const [element] = newElements.splice(elementIndex, 1);

      if (direction === "front") {
        newElements.push(element);
      } else {
        newElements.unshift(element);
      }

      const updatedElements = newElements.map((el, index) => ({
        ...el,
        zIndex: index,
      }));
      setElements(updatedElements);
      saveToHistory(updatedElements);
    },
    [elements, saveToHistory]
  );

  // Drag & Drop
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, handle?: string) => {
      e.stopPropagation();
      e.preventDefault();
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      setSelectedId(elementId);

      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
      } else {
        setIsDragging(true);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [elements]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const currentZoom = isManualZoom ? zoom : autoZoom;
      const x = (e.clientX - canvasRect.left) / currentZoom;
      const y = (e.clientY - canvasRect.top) / currentZoom;

      if (isDragging && selectedId) {
        const element = elements.find((el) => el.id === selectedId);
        if (!element) return;

        const newX = snapToGrid(x - dragOffset.x);
        const newY = snapToGrid(y - dragOffset.y);

        updateElement(selectedId, {
          x: Math.max(0, Math.min(newX, A4_WIDTH - element.width)),
          y: Math.max(0, Math.min(newY, A4_HEIGHT - element.height)),
        });
      } else if (isResizing && selectedId) {
        const element = elements.find((el) => el.id === selectedId);
        if (!element) return;

        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;

        if (resizeHandle?.includes("right"))
          newWidth = snapToGrid(x - element.x);
        if (resizeHandle?.includes("bottom"))
          newHeight = snapToGrid(y - element.y);
        if (resizeHandle?.includes("left")) {
          newWidth = snapToGrid(element.x + element.width - x);
          newX = element.x + element.width - newWidth;
        }
        if (resizeHandle?.includes("top")) {
          newHeight = snapToGrid(element.y + element.height - y);
          newY = element.y + element.height - newHeight;
        }

        updateElement(selectedId, {
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: Math.max(MIN_WIDTH, newWidth),
          height: Math.max(MIN_HEIGHT, newHeight),
        });
      }
    },
    [
      isDragging,
      isResizing,
      selectedId,
      dragOffset,
      resizeHandle,
      zoom,
      autoZoom,
      isManualZoom,
      elements,
      snapToGrid,
      updateElement,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedId) {
        e.preventDefault();
        const element = elements.find((el) => el.id === selectedId);
        if (element) {
          navigator.clipboard.writeText(JSON.stringify(element));
          setCopiedElement(element);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && copiedElement) {
        e.preventDefault();
        const newElement: EditorElement = {
          ...copiedElement,
          id: generateId(),
          x: copiedElement.x + GRID_SIZE,
          y: copiedElement.y + GRID_SIZE,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        saveToHistory(newElements);
        setSelectedId(newElement.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    selectedId,
    deleteElement,
    elements,
    copiedElement,
    generateId,
    saveToHistory,
  ]);

  // Экспорт в DOCX
  const handleExportDOCX = useCallback(async () => {
    if (elements.length === 0) {
      setError("Нет элементов для экспорта");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const docSections: any[] = [];

      if (title) {
        docSections.push({
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
          ],
        });
      }

      if (description) {
        docSections.push({
          properties: {},
          children: [
            new Paragraph({
              text: description,
              style: "Subtitle",
            }),
            new Paragraph({}),
          ],
        });
      }

      const elementsParagraphs: any[] = [];

      elements.forEach((el) => {
        if (el.type === "text") {
          const props = el.properties as TextProperties;
          elementsParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: props.content,
                  font: props.fontFamily,
                  size: props.fontSize * 2,
                  bold: props.bold,
                  italics: props.italic,
                  underline: props.underline,
                  color: props.color.replace("#", ""),
                }),
              ],
              alignment:
                props.align === "center"
                  ? AlignmentType.CENTER
                  : props.align === "right"
                  ? AlignmentType.RIGHT
                  : AlignmentType.LEFT,
            })
          );
        } else if (el.type === "signature") {
          const props = el.properties as SignatureProperties;
          elementsParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: props.text,
                  size: props.fontSize * 2,
                  color: props.color.replace("#", ""),
                }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
          elementsParagraphs.push(new Paragraph({}));
        } else if (el.type === "table") {
          const props = el.properties as TableProperties;
          const rows: TableRow[] = [];

          // Создаем данные таблицы если их нет
          const tableData =
            props.data ||
            Array(props.rows)
              .fill(null)
              .map(() => Array(props.cols).fill(""));

          for (let i = 0; i < props.rows; i++) {
            const cells: TableCell[] = [];
            for (let j = 0; j < props.cols; j++) {
              cells.push(
                new TableCell({
                  children: [
                    new Paragraph({
                      text: tableData[i]?.[j] || "",
                    }),
                  ],
                  width: {
                    size: 100 / props.cols,
                    type: WidthType.PERCENTAGE,
                  },
                  borders: {
                    top: {
                      style: "single",
                      size: props.borderWidth * 8,
                      color: props.borderColor.replace("#", ""),
                    },
                    bottom: {
                      style: "single",
                      size: props.borderWidth * 8,
                      color: props.borderColor.replace("#", ""),
                    },
                    left: {
                      style: "single",
                      size: props.borderWidth * 8,
                      color: props.borderColor.replace("#", ""),
                    },
                    right: {
                      style: "single",
                      size: props.borderWidth * 8,
                      color: props.borderColor.replace("#", ""),
                    },
                  },
                })
              );
            }
            rows.push(new TableRow({ cells }));
          }
          elementsParagraphs.push(
            new Table({
              rows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
            })
          );
          elementsParagraphs.push(new Paragraph({}));
        } else if (el.type === "date") {
          const props = el.properties as DateProperties;
          elementsParagraphs.push(
            new Paragraph({
              text: `Дата: ${props.value || new Date().toLocaleDateString()}`,
            })
          );
        } else if (el.type === "divider") {
          const props = el.properties as DividerProperties;
          elementsParagraphs.push(
            new Paragraph({
              text: "",
              border: {
                top: {
                  style:
                    props.style === "dashed"
                      ? "dashed"
                      : props.style === "dotted"
                      ? "dotted"
                      : "single",
                  size: props.thickness * 8,
                  color: props.color.replace("#", ""),
                },
              },
            })
          );
        } else if (el.type === "image") {
          const props = el.properties as ImageProperties;
          if (props.src) {
            elementsParagraphs.push(
              new Paragraph({
                text: `[Изображение: ${props.alt}]`,
                style: "ImageCaption",
              })
            );
          }
        }
      });

      docSections.push({
        properties: {},
        children: elementsParagraphs,
      });

      const doc = new Document({
        sections: docSections,
        styles: {
          paragraphStyles: [
            {
              id: "Subtitle",
              name: "Subtitle",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 22,
                color: "666666",
              },
            },
            {
              id: "ImageCaption",
              name: "Image Caption",
              basedOn: "Normal",
              next: "Normal",
              run: {
                size: 20,
                italics: true,
                color: "999999",
              },
            },
          ],
        },
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title || "document"}.docx`);
    } catch (err) {
      console.error("DOCX Export Error:", err);
      setError(
        "Ошибка экспорта DOCX: " +
          (err instanceof Error ? err.message : "Неизвестная ошибка")
      );
    } finally {
      setLoading(false);
    }
  }, [elements, title, description]);

  const generateHTMLFromElements = useCallback(
    (els: EditorElement[]) => {
      const elementsHTML = els
        .map((el) => {
          const commonStyle = `position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;`;

          if (el.type === "text") {
            const props = el.properties as TextProperties;
            return `<div style="${commonStyle}">
          <p style="margin: 0; font-family: ${props.fontFamily}; font-size: ${
              props.fontSize
            }px; color: ${props.color}; font-weight: ${
              props.bold ? "bold" : "normal"
            }; font-style: ${
              props.italic ? "italic" : "normal"
            }; text-decoration: ${
              props.underline ? "underline" : "none"
            }; text-align: ${props.align}; word-wrap: break-word;">${
              props.content
            }</p>
        </div>`;
          }
          if (el.type === "image") {
            const props = el.properties as ImageProperties;
            return `<div style="${commonStyle}">
          <img src="${
            props.src ||
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
          }" alt="${
              props.alt
            }" style="width: 100%; height: 100%; object-fit: cover;">
        </div>`;
          }
          if (el.type === "table") {
            const props = el.properties as TableProperties;
            const tableData =
              props.data ||
              Array(props.rows)
                .fill(null)
                .map(() => Array(props.cols).fill(""));
            const cells = tableData
              .map(
                (row, i) =>
                  `<tr>${row
                    .map(
                      (cell, j) =>
                        `<td style="border: ${props.borderWidth}px solid ${props.borderColor}; padding: 8px; background: ${props.cellBg};">${cell}</td>`
                    )
                    .join("")}</tr>`
              )
              .join("");
            return `<div style="${commonStyle}">
          <table style="border-collapse: collapse; width: 100%; height: 100%;">${cells}</table>
        </div>`;
          }
          if (el.type === "date") {
            const props = el.properties as DateProperties;
            return `<div style="${commonStyle}">
          <input type="date" value="${props.value}" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
        </div>`;
          }
          if (el.type === "signature") {
            const props = el.properties as SignatureProperties;
            return `<div style="${commonStyle}">
          <div style="width: 100%; border-bottom: 2px solid ${props.color}; padding-bottom: 4px; font-size: ${props.fontSize}px; color: ${props.color}; font-family: cursive; text-align: center;">
            ${props.text}
          </div>
        </div>`;
          }
          if (el.type === "divider") {
            const props = el.properties as DividerProperties;
            return `<div style="${commonStyle}">
          <div style="width: 100%; border-top: ${props.thickness}px ${props.style} ${props.color};"></div>
        </div>`;
          }
          return "";
        })
        .filter(Boolean);

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || "Document"}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 20px; position: relative; width: ${A4_WIDTH}px; min-height: ${A4_HEIGHT}px; background: white; }
    .container { position: relative; width: 100%; height: 100%; }
    * { box-sizing: border-box; }
    @media print { body { width: 210mm; min-height: 297mm; } }
  </style>
</head>
<body>
  <div class="container">${elementsHTML.join("")}</div>
</body>
</html>`;
    },
    [title]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Введите название шаблона");
      return;
    }
    if (elements.length === 0) {
      setError("Добавьте хотя бы один элемент");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exportData = {
        version: "1.0",
        title,
        description,
        template_type: templateType,
        visibility,
        elements: elements.map((el) => ({
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          properties: el.properties,
        })),
      };
      const htmlContent = generateHTMLFromElements(elements);

      console.log("Template saved:", { title, htmlContent, exportData });

      localStorage.removeItem(LOCALSTORAGE_KEY);
      navigate(`/dashboard`);
    } catch (err) {
      console.error("Save Error:", err);
      setError(
        "Ошибка сохранения шаблона: " +
          (err instanceof Error ? err.message : "Неизвестная ошибка")
      );
    } finally {
      setLoading(false);
    }
  };

  // Редактирование ячеек таблицы (НЕКОНТРОЛИРУЕМЫЙ РЕЖИМ)
  const handleTableCellEdit = (
    elementId: string,
    row: number,
    col: number,
    value: string
  ) => {
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.type !== "table") return;

    const props = element.properties as TableProperties;
    const newData = [...(props.data || [])];

    // Инициализируем массив если нужно
    if (!newData[row]) {
      newData[row] = [];
    }
    newData[row][col] = value;

    updateProperties(elementId, {
      data: newData,
    } as Partial<TableProperties>);
  };

  // Рендер элемента
  const renderElement = useCallback(
    (element: EditorElement) => {
      const isSelected = element.id === selectedId;

      return (
        <div
          key={element.id}
          className={`element ${isSelected ? "selected" : ""}`}
          style={{
            position: "absolute",
            left: `${element.x}px`,
            top: `${element.y}px`,
            width: `${element.width}px`,
            height: `${element.height}px`,
            zIndex: element.zIndex,
            cursor:
              isDragging && selectedId === element.id ? "grabbing" : "move",
            // Плавное перемещение без Shift
            transition: isShiftPressed ? "none" : "all 0.1s ease-out",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(element.id);
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
        >
          {element.type === "text" && (
            <div className="text-element">
              <p
                style={{
                  margin: 0,
                  fontFamily: (element.properties as TextProperties).fontFamily,
                  fontSize: `${
                    (element.properties as TextProperties).fontSize
                  }px`,
                  color: (element.properties as TextProperties).color,
                  fontWeight: (element.properties as TextProperties).bold
                    ? "bold"
                    : "normal",
                  fontStyle: (element.properties as TextProperties).italic
                    ? "italic"
                    : "normal",
                  textDecoration: (element.properties as TextProperties)
                    .underline
                    ? "underline"
                    : "none",
                  textAlign: (element.properties as TextProperties).align,
                  lineHeight: 1.4,
                }}
              >
                {(element.properties as TextProperties).content}
              </p>
            </div>
          )}

          {element.type === "image" && (
            <div className="image-element">
              {(element.properties as ImageProperties).src ? (
                <img
                  src={(element.properties as ImageProperties).src}
                  alt={(element.properties as ImageProperties).alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "var(--radius-sm)",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="dropzone">
                  <div className="dropzone-icon">
                    <Upload size={24} />
                  </div>
                  <p>Нажмите для загрузки</p>
                </div>
              )}
            </div>
          )}

          {element.type === "table" && (
            <div className="table-element">
              <table
                style={{
                  width: "100%",
                  height: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  {Array.from({
                    length: (element.properties as TableProperties).rows,
                  }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({
                        length: (element.properties as TableProperties).cols,
                      }).map((__, j) => (
                        <td
                          key={`${i}-${j}`}
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            // Активируем редактирование
                            const target = e.currentTarget;
                            target.focus();
                            const range = document.createRange();
                            range.selectNodeContents(target);
                            const selection = window.getSelection();
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }}
                          onBlur={(e) =>
                            handleTableCellEdit(
                              element.id,
                              i,
                              j,
                              (e.currentTarget.textContent || "").trim()
                            )
                          }
                          style={{
                            border: `${
                              (element.properties as TableProperties)
                                .borderWidth
                            }px solid ${
                              (element.properties as TableProperties)
                                .borderColor
                            }`,
                            background: (element.properties as TableProperties)
                              .cellBg,
                            padding: "8px",
                            minWidth: "60px",
                            outline: "none",
                            cursor: "text",
                            textAlign: "left",
                            direction: "ltr",
                            unicodeBidi: "normal",
                          }}
                        >
                          {(element.properties as TableProperties).data?.[i]?.[
                            j
                          ] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {element.type === "date" && (
            <div className="date-element">
              <input
                type="date"
                value={
                  (element.properties as DateProperties).value ||
                  new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  updateProperties(element.id, {
                    value: e.target.value,
                  } as Partial<DateProperties>)
                }
                onClick={(e) => e.stopPropagation()}
                className="date-input"
              />
            </div>
          )}

          {element.type === "signature" && (
            <div className="signature-element">
              <div
                className="signature-line"
                style={{
                  borderBottom: `2px solid ${
                    (element.properties as SignatureProperties).color
                  }`,
                  fontSize: `${
                    (element.properties as SignatureProperties).fontSize
                  }px`,
                  color: (element.properties as SignatureProperties).color,
                }}
              >
                {(element.properties as SignatureProperties).text}
              </div>
            </div>
          )}

          {element.type === "divider" && (
            <div className="divider-element">
              <div
                style={{
                  borderTop: `${
                    (element.properties as DividerProperties).thickness
                  }px ${(element.properties as DividerProperties).style} ${
                    (element.properties as DividerProperties).color
                  }`,
                }}
              />
            </div>
          )}

          {isSelected && (
            <>
              <div
                className="resize-handle"
                data-handle="top-left"
                onMouseDown={(e) => handleMouseDown(e, element.id, "top-left")}
              />
              <div
                className="resize-handle"
                data-handle="top-right"
                onMouseDown={(e) => handleMouseDown(e, element.id, "top-right")}
              />
              <div
                className="resize-handle"
                data-handle="bottom-left"
                onMouseDown={(e) =>
                  handleMouseDown(e, element.id, "bottom-left")
                }
              />
              <div
                className="resize-handle"
                data-handle="bottom-right"
                onMouseDown={(e) =>
                  handleMouseDown(e, element.id, "bottom-right")
                }
              />
            </>
          )}
        </div>
      );
    },
    [selectedId, isDragging, handleMouseDown, updateProperties]
  );

  const currentZoom = isManualZoom ? zoom : autoZoom;

  return (
    <div className="container-1600">
      <div className="nav">
        <div className="nav-inner">
          <a href="/dashboard" className="nav-brand">
            <ArrowLeft size={20} />
            Редактор шаблонов
          </a>
          <button
            className="btn btn-secondary"
            onClick={() => setIsDocModalOpen(true)}
          >
            <HelpCircle size={20} />
            Справка
          </button>
        </div>
      </div>

      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Документация"
      >
        <DocumentationPanel />
      </Modal>

      {error && (
        <div className="error-message mb-4">
          <strong>Ошибка:</strong> {error}
        </div>
      )}

      <div className="surface mb-6">
        <div className="grid grid-2" style={{ padding: "var(--sp-6)" }}>
          <div className="form-group">
            <label className="label" htmlFor="title">
              <File size={14} />
              Название шаблона *
            </label>
            <input
              type="text"
              id="title"
              className="input input-highlight"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Договор о поставке"
              required
            />
            <small className="input-hint">
              Название будет использовано при экспорте и в списке шаблонов
            </small>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="visibility">
              <EyeIcon size={14} />
              Видимость
            </label>
            <select
              id="visibility"
              className="select input-highlight"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityType)}
            >
              <option value="PUBLIC">Публичный - доступен всем</option>
              <option value="RESTRICTED">Ограниченный - по приглашению</option>
            </select>
            <small className="input-hint">
              Определяет, кто сможет просматривать и использовать этот шаблон
            </small>
          </div>
        </div>

        <div
          className="form-group"
          style={{ padding: "0 var(--sp-6) var(--sp-6)" }}
        >
          <label className="label" htmlFor="description">
            Описание
          </label>
          <textarea
            id="description"
            className="input textarea input-highlight"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание шаблона (необязательно)"
            rows={3}
          />
          <small className="input-hint">
            Описание поможет другим понять назначение шаблона
          </small>
        </div>
      </div>

      <div className="editor-layout">
        <div className="panel panel-left">
          <ElementsPanel
            onAddElement={addElement}
            onImageUpload={handleImageUpload}
            gridVisible={gridVisible}
            onToggleGrid={setGridVisible}
            zoom={zoom}
            autoZoom={autoZoom}
            isManualZoom={isManualZoom}
            onZoomChange={(newZoom, isManual) => {
              setZoom(newZoom);
              setIsManualZoom(isManual);
            }}
          />
        </div>

        <div className="panel panel-center" ref={canvasContainerRef}>
          <div className="canvas-toolbar flex-between mb-4">
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={undo}
                disabled={historyIndex <= 0}
                title="Отменить (Ctrl+Z)"
              >
                <Undo2 size={14} />
                Отменить
              </button>
              <button
                className="btn btn-secondary"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Повторить (Ctrl+Y)"
              >
                <Redo2 size={14} />
                Повторить
              </button>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (
                    confirm("Очистить холст? Это действие нельзя отменить.")
                  ) {
                    setElements([]);
                    saveToHistory([]);
                    setSelectedId(null);
                  }
                }}
              >
                <Trash2 size={14} />
                Очистить
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleExportDOCX}
                title="Экспорт DOCX"
              >
                <FileDown size={14} />
                DOCX
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const html = generateHTMLFromElements(elements);
                  const blob = new Blob([html], { type: "text/html" });
                  saveAs(blob, `${title || "template"}.html`);
                }}
                title="Экспорт HTML"
              >
                <File size={14} />
                HTML
              </button>
            </div>
          </div>

          <div className="shift-hint">
            {isShiftPressed && (
              <div className="shift-indicator">
                <Move size={12} />
                Привязка к сетке активна
              </div>
            )}
          </div>

          <div
            ref={canvasRef}
            className="canvas"
            style={{
              width: `${A4_WIDTH}px`,
              height: `${A4_HEIGHT}px`,
              transform: `scale(${currentZoom})`,
              transformOrigin: "top left",
              background: gridVisible
                ? `repeating-linear-gradient(0deg, var(--c-bg-200) 0px, transparent 1px, transparent ${GRID_SIZE}px, var(--c-bg-200) ${
                    GRID_SIZE + 1
                  }px),
                   repeating-linear-gradient(90deg, var(--c-bg-200) 0px, transparent 1px, transparent ${GRID_SIZE}px, var(--c-bg-200) ${
                    GRID_SIZE + 1
                  }px)`
                : "var(--c-bg-100)",
            }}
            onClick={() => setSelectedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files.length > 0 && files[0].type.startsWith("image/")) {
                handleImageUpload(files[0]);
              }
            }}
          >
            {elements.map(renderElement)}
          </div>
        </div>

        <div className="panel panel-right">
          <PropertiesPanel
            selectedElement={selectedElement}
            onUpdateElement={updateElement}
            onUpdateProperties={updateProperties}
            onDeleteElement={deleteElement}
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
            <ArrowLeft size={14} />
            Назад
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save size={14} />
                Сохранить шаблон
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        /* Все CSS переменные и стили из вашего design-system */
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

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: var(--font-sans);
          background: var(--c-bg-200);
          color: var(--c-ink-800);
          line-height: 1.5;
          min-height: 100vh;
        }

        .container-1600 {
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 var(--sp-4) var(--sp-6);
        }

        .surface {
          background: var(--c-bg-100);
          border: var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
        }

        .text-muted-ink {
          color: var(--c-ink-600);
        }

        h1, .h1 {
          font-size: var(--fs-1);
          font-weight: 700;
          color: var(--c-ink-800);
        }

        h2, .h2 {
          font-size: var(--fs-2);
          font-weight: 700;
          color: var(--c-ink-800);
        }

        h3, .h3 {
          font-size: var(--fs-3);
          font-weight: 600;
          color: var(--c-ink-800);
        }

        .grid {
          display: grid;
          gap: var(--sp-4);
        }

        .grid-2 {
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        }

        .flex {
          display: flex;
        }

        .flex-between {
          justify-content: space-between;
          align-items: center;
        }

        .gap-2 { gap: var(--sp-2); }
        .gap-3 { gap: var(--sp-3); }
        .mb-2 { margin-bottom: var(--sp-2); }
        .mb-3 { margin-bottom: var(--sp-3); }
        .mb-4 { margin-bottom: var(--sp-4); }
        .mb-6 { margin-bottom: var(--sp-6); }
        .mt-4 { margin-top: var(--sp-4); }
        .mt-6 { margin-top: var(--sp-6); }

        .form-group {
          margin-bottom: var(--sp-5);
        }

        .label {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--fs-5);
          font-weight: 500;
          margin-bottom: var(--sp-2);
          color: var(--c-ink-800);
        }

        .input, .select, .textarea {
          width: 100%;
          padding: var(--sp-3) var(--sp-4);
          border: var(--border);
          border-radius: var(--radius-sm);
          font-size: var(--fs-4);
          background: var(--c-bg-100);
          color: var(--c-ink-800);
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }

        /* Выделенные поля формы */
        .input-highlight {
          border-left: 4px solid var(--c-accent);
          background: var(--c-bg-100);
          position: relative;
          overflow: visible;
        }

        .input-highlight:focus {
          border-color: var(--c-accent);
          box-shadow: var(--ring);
        }

        .textarea {
          resize: vertical;
          min-height: 120px;
        }
          

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-2);
          padding: var(--sp-3) var(--sp-5);
          border-radius: var(--radius-sm);
          font-size: var(--fs-5);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.16s ease;
          border: none;
          text-decoration: none;
        }

        .btn:focus {
          outline: none;
          box-shadow: var(--ring);
        }

        .btn-primary {
          background: var(--c-accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #c93509;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--c-bg-100);
          color: var(--c-ink-800);
          border: var(--border);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--c-bg-200);
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-danger {
          background: var(--c-accent);
          color: white;
        }

        .btn-ghost {
          background: transparent;
          color: var(--c-ink-800);
        }

        .btn-ghost:hover {
          background: var(--c-bg-200);
        }

        .btn-full {
          width: 100%;
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .editor-layout {
          display: grid;
          grid-template-columns: 280px 1fr 340px;
          gap: var(--sp-5);
          min-height: 800px;
        }

        .panel {
          background: var(--c-bg-100);
          border: var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--sp-5);
          height: fit-content;
          overflow-y: auto;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: var(--fs-3);
          font-weight: 600;
          margin: 0 0 var(--sp-4) 0;
          color: var(--c-ink-800);
        }

        .panel-center {
          padding: var(--sp-5);
          overflow: auto;
          max-height: calc(100vh - 200px);
        }

        .panel-left,
        .panel-right {
          position: sticky;
          top: var(--sp-4);
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .canvas {
          position: relative;
          border: 2px solid var(--c-bg-200);
          border-radius: var(--radius-md);
          min-height: 600px;
          box-shadow: var(--shadow-md);
          background: white;
          overflow: hidden;
        }

        .element {
          border: 2px solid transparent;
          transition: all 0.2s ease;
          user-select: none;
        }

        .element:hover {
          border-color: var(--c-accent);
        }

        .element.selected {
          border-color: var(--c-accent);
          box-shadow: var(--ring);
        }

        .text-element {
          width: 100%;
          height: 100%;
          padding: var(--sp-3);
          overflow: hidden;
        }

        .image-element {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .image-element img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: "var(--radius-sm)";
        }

        .dropzone {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed var(--c-bg-300);
          border-radius: var(--radius-sm);
          background: var(--c-bg-200);
          color: var(--c-ink-400);
          font-size: var(--fs-5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .panel-tabs {
          display: flex;
          gap: var(--sp-2);
          margin-bottom: var(--sp-4);
          border-bottom: var(--border);
          padding-bottom: var(--sp-2);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          padding: var(--sp-2) var(--sp-4);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: var(--fs-5);
          color: var(--c-ink-600);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .tab:hover {
          background: var(--c-bg-200);
        }

        .tab.active {
          color: var(--c-accent);
          background: rgba(231, 63, 12, 0.08);
        }

        .dropzone:hover {
          border-color: var(--c-accent);
          background: rgba(231, 63, 12, 0.05);
        }

        .dropzone-icon {
          margin-bottom: var(--sp-2);
          opacity: 0.5;
        }

        .table-element {
          width: 100%;
          height: 100%;
          overflow: auto;
          padding: var(--sp-2);
        }

        .table-element table {
          width: 100%;
          height: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .table-element td {
          min-width: 60px;
        }

        .date-element {
          padding: var(--sp-3);
        }

        .date-input {
          width: 100%;
          padding: var(--sp-2);
          border: var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .signature-element {
          padding: var(--sp-3);
          height: 100%;
          display: flex;
          align-items: center;
        }

        .signature-line {
          width: 100%;
          padding-bottom: 4px;
          font-family: cursive;
          text-align: center;
        }

        .divider-element {
          padding: var(--sp-3);
          height: 100%;
          display: flex;
          align-items: center;
        }

        .resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--c-accent);
          border: 2px solid white;
          border-radius: 50%;
          cursor: se-resize;
          z-index: 1000;
        }

        .resize-handle[data-handle*="top"] {
          cursor: n-resize;
          top: -6px;
        }

        .resize-handle[data-handle*="bottom"] {
          cursor: s-resize;
          bottom: -6px;
        }

        .resize-handle[data-handle*="left"] {
          cursor: w-resize;
          left: -6px;
        }

        .resize-handle[data-handle*="right"] {
          cursor: e-resize;
          right: -6px;
        }

        .canvas-toolbar {
          background: var(--c-bg-200);
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--radius-sm);
          margin-bottom: var(--sp-4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--sp-3);
        }

        .shift-hint {
          position: absolute;
          top: var(--sp-2);
          right: var(--sp-2);
          z-index: 10;
        }

        .shift-indicator {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
          padding: var(--sp-1) var(--sp-2);
          background: var(--c-accent);
          color: white;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .element-buttons {
          display: grid;
          gap: var(--sp-3);
        }

        .panel-section {
          margin-top: var(--sp-4);
          padding-top: var(--sp-4);
          border-top: var(--border);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--c-ink-600);
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-3);
        }

        .properties-placeholder {
          text-align: center;
          padding: var(--sp-6);
        }

        .placeholder-icon {
          width: 60px;
          height: 60px;
          margin: 0 auto var(--sp-4);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--c-bg-200);
          border-radius: 50%;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sp-3);
        }

        .properties-section {
          margin-top: var(--sp-4);
          padding-top: var(--sp-4);
          border-top: var(--border);
        }

        .input-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--c-ink-400);
          margin-top: var(--sp-1);
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          padding: var(--sp-4);
          border-radius: var(--radius-sm);
          margin-bottom: var(--sp-4);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: var(--sp-1) var(--sp-2);
          background: var(--c-bg-200);
          color: var(--c-ink-800);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .kbd {
          background: var(--c-bg-200);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.875rem;
          border: var(--border);
        }

        .nav {
          background: var(--c-bg-100);
          border-bottom: var(--border);
          padding: var(--sp-4) var(--sp-6);
          margin-bottom: var(--sp-6);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-inner {
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          font-size: var(--fs-3);
          font-weight: 700;
          color: var(--c-ink-800);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: var(--sp-2);
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--sp-4);
        }

        .modal-content {
          background: var(--c-bg-100);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          max-width: 800px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-4) var(--sp-6);
          border-bottom: var(--border);
          background: var(--c-bg-100);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .modal-body {
          padding: 0;
          overflow: hidden;
          display: flex;
          min-height: 500px;
        }

        .documentation-panel {
          display: flex;
          flex-direction: row;
          height: 100%;
          width: 100%;
        }

        .doc-navigation {
          display: flex;
          flex-direction: column;
          padding: var(--sp-4);
          border-right: var(--border);
          min-width: 220px;
          max-width: 220px;
          width: 220px;
          background: var(--c-bg-200);
          gap: var(--sp-2);
          flex-shrink: 0;
        }

        .doc-nav-item {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: var(--sp-3) var(--sp-4);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: var(--fs-5);
          color: var(--c-ink-600);
          border-radius: var(--radius-sm);
          transition: all 0.2s;
          text-align: left;
          margin-bottom: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-nav-item:hover {
          background: var(--c-bg-100);
          color: var(--c-ink-800);
        }

        .doc-nav-item.active {
          color: var(--c-accent);
          background: var(--c-accent-light);
        }

        .doc-nav-item svg {
          flex-shrink: 0;
        }

        .doc-content-wrapper {
          flex: 1;
          padding: var(--sp-6);
          overflow-y: auto;
          max-height: 60vh;
        }

        .doc-content {
          max-width: 600px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .doc-heading {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          font-size: var(--fs-4);
          font-weight: 600;
          margin-bottom: var(--sp-4);
          color: var(--c-ink-800);
          padding-bottom: var(--sp-2);
          border-bottom: 1px solid var(--c-bg-200);
        }

        .doc-list {
          list-style: none;
          padding: 0;
          margin-bottom: var(--sp-5);
        }

        .doc-item {
          display: flex;
          align-items: flex-start;
          gap: var(--sp-3);
          margin-bottom: var(--sp-3);
          font-size: var(--fs-5);
          line-height: 1.6;
          padding: var(--sp-2);
          border-radius: var(--radius-sm);
          transition: background 0.2s;
        }

        .doc-item:hover {
          background: var(--c-bg-200);
        }

        .doc-item kbd {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .doc-text {
          font-size: var(--fs-5);
          color: var(--c-ink-600);
          line-height: 1.7;
          margin-bottom: var(--sp-3);
          padding: var(--sp-3);
          background: var(--c-accent-light);
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--c-accent);
        }

        .doc-text strong {
          color: var(--c-ink-800);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .editor-layout {
            grid-template-columns: 1fr;
            grid-template-areas: "left" "center" "right";
            gap: var(--sp-4);
          }

          .panel {
            max-height: none;
          }

          .panel-left,
          .panel-right {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .container-1600 {
            padding: var(--sp-4);
          }

          .panel-left,
          .panel-right {
            display: none;
          }

          .editor-layout {
            grid-template-areas: "center";
          }

          .canvas-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .canvas-toolbar > div {
            justify-content: center;
          }

          .grid-2 {
            grid-template-columns: 1fr;
          }

          .modal-body {
            flex-direction: column;
          }

          .doc-navigation {
            flex-direction: row;
            overflow-x: auto;
            border-right: none;
            border-bottom: var(--border);
            padding: var(--sp-3);
            min-width: auto;
            max-width: none;
            width: auto;
          }

          .doc-nav-item {
            margin-bottom: 0;
            margin-right: var(--sp-2);
            white-space: nowrap;
            padding: var(--sp-2) var(--sp-3);
          }

          .doc-content-wrapper {
            padding: var(--sp-4);
          }
        }
      `}</style>
    </div>
  );
}
