import React from "react";
import {
  Settings,
  Type,
  Palette,
  TableIcon,
  Signature,
  Minus,
  ArrowDown,
  ArrowUp,
  Trash2,
  Copy,
  Upload,
} from "lucide-react";
import type {
  IEditorElement,
  ITextProperties,
  IImageProperties,
  ITableProperties,
  ISignatureProperties,
  IDividerProperties,
} from "../../utils/types/editor.types";

interface Props {
  selected: IEditorElement | null;
  onUpdateEl: (id: string, upd: Partial<IEditorElement>) => void;
  onUpdateProps: (id: string, p: any) => void;
  onDelete: (id: string) => void;
  onMoveLayer: (id: string, d: "front" | "back") => void;
  onEditSignature?: (id: string) => void;
}

const PropertiesPanel: React.FC<Props> = ({
  selected,
  onUpdateEl,
  onUpdateProps,
  onDelete,
  onMoveLayer,
  onEditSignature,
}) => {
  if (!selected)
    return (
      <div className="properties-placeholder">
        <div className="placeholder-icon">
          <Type size={24} />
        </div>
        <h3 className="h3 mb-2">Выберите элемент</h3>
        <p className="text-muted-ink">
          Нажмите на любой элемент на холсте, чтобы настроить его свойства
        </p>
      </div>
    );

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
            value={selected.x}
            onChange={(e) =>
              onUpdateEl(selected.id, { x: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="form-group">
          <label className="label">Позиция Y</label>
          <input
            type="number"
            className="input"
            value={selected.y}
            onChange={(e) =>
              onUpdateEl(selected.id, { y: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="form-group">
          <label className="label">Ширина</label>
          <input
            type="number"
            className="input"
            value={selected.width}
            onChange={(e) =>
              onUpdateEl(selected.id, {
                width: Math.max(50, parseInt(e.target.value) || 50),
              })
            }
          />
        </div>
        <div className="form-group">
          <label className="label">Высота</label>
          <input
            type="number"
            className="input"
            value={selected.height}
            onChange={(e) =>
              onUpdateEl(selected.id, {
                height: Math.max(30, parseInt(e.target.value) || 30),
              })
            }
          />
        </div>
      </div>

      {selected.type === "text" && (
        <TextProps el={selected} onUpdate={onUpdateProps} />
      )}
      {selected.type === "image" && (
        <ImageProps el={selected} onUpdate={onUpdateProps} />
      )}
      {selected.type === "table" && (
        <TableProps el={selected} onUpdate={onUpdateProps} />
      )}
      {selected.type === "signature" && (
        <SignatureProps
          el={selected}
          onUpdate={onUpdateProps}
          onEdit={onEditSignature}
        />
      )}
      {selected.type === "divider" && (
        <DividerProps el={selected} onUpdate={onUpdateProps} />
      )}

      <div className="properties-section">
        <button
          className="btn btn-secondary btn-full mb-3"
          onClick={() => onMoveLayer(selected.id, "back")}
        >
          <ArrowDown size={14} />
          На задний план
        </button>
        <button
          className="btn btn-secondary btn-full mb-3"
          onClick={() => onMoveLayer(selected.id, "front")}
        >
          <ArrowUp size={14} />
          На передний план
        </button>
        <button
          className="btn btn-danger btn-full mb-3"
          onClick={() => onDelete(selected.id)}
        >
          <Trash2 size={14} />
          Удалить элемент
        </button>
        <button
          className="btn btn-secondary btn-full"
          onClick={() =>
            navigator.clipboard
              .writeText(JSON.stringify(selected))
              .then(() => alert("Элемент скопирован!"))
          }
        >
          <Copy size={14} />
          Копировать элемент
        </button>
      </div>
    </div>
  );
};

/* ---------- под-компоненты свойств ---------- */
const TextProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
}> = ({ el, onUpdate }) => {
  const p = el.properties as ITextProperties;
  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <Type size={14} />
          Текст
        </label>
        <textarea
          className="input textarea"
          rows={3}
          value={p.content}
          onChange={(e) => onUpdate(el.id, { content: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="label">Шрифт</label>
        <select
          className="select"
          value={p.fontFamily}
          onChange={(e) => onUpdate(el.id, { fontFamily: e.target.value })}
        >
          <option>Inter</option>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
          <option>Georgia</option>
          <option>Verdana</option>
        </select>
      </div>
      <div className="form-group">
        <label className="label">Размер шрифта: {p.fontSize}px</label>
        <input
          type="range"
          min="8"
          max="72"
          value={p.fontSize}
          onChange={(e) =>
            onUpdate(el.id, { fontSize: parseInt(e.target.value) })
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
          value={p.color}
          onChange={(e) => onUpdate(el.id, { color: e.target.value })}
        />
      </div>
      <div className="checkbox-grid">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={p.bold}
            onChange={(e) => onUpdate(el.id, { bold: e.target.checked })}
          />
          <span>Жирный</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={p.italic}
            onChange={(e) => onUpdate(el.id, { italic: e.target.checked })}
          />
          <span>Курсив</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={p.underline}
            onChange={(e) => onUpdate(el.id, { underline: e.target.checked })}
          />
          <span>Подчеркнутый</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={p.align === "center"}
            onChange={(e) =>
              onUpdate(el.id, { align: e.target.checked ? "center" : "left" })
            }
          />
          <span>По центру</span>
        </label>
      </div>
    </div>
  );
};

const ImageProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
}> = ({ el, onUpdate }) => {
  const p = el.properties as IImageProperties;
  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <Upload size={14} />
          URL изображения
        </label>
        <input
          type="text"
          className="input"
          value={p.src}
          onChange={(e) => onUpdate(el.id, { src: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
        <small className="input-hint">Поддерживаются URL или data URI</small>
      </div>
    </div>
  );
};

const TableProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
}> = ({ el, onUpdate }) => {
  const p = el.properties as ITableProperties;
  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <TableIcon size={14} />
          Строки: {p.rows}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={p.rows}
          onChange={(e) => onUpdate(el.id, { rows: parseInt(e.target.value) })}
          className="input-range"
        />
      </div>
      <div className="form-group">
        <label className="label">Столбцы: {p.cols}</label>
        <input
          type="range"
          min="1"
          max="10"
          value={p.cols}
          onChange={(e) => onUpdate(el.id, { cols: parseInt(e.target.value) })}
          className="input-range"
        />
      </div>
      <div className="form-group">
        <label className="label">Цвет границ</label>
        <input
          type="color"
          className="input"
          value={p.borderColor}
          onChange={(e) => onUpdate(el.id, { borderColor: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="label">Редактирование</label>
        <small className="input-hint">
          Двойной клик по ячейке таблицы на холсте для редактирования
        </small>
      </div>
    </div>
  );
};

const SignatureProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
  onEdit?: (id: string) => void;
}> = ({ el, onUpdate, onEdit }) => {
  const p = el.properties as ISignatureProperties & { image?: string };
  const uploadImage = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        onUpdate(el.id, { image: src });
      };
      reader.readAsDataURL(f);
    };
    inp.click();
  };
  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <Signature size={14} />
          Текст подписи
        </label>
        <input
          type="text"
          className="input"
          value={p.text}
          onChange={(e) => onUpdate(el.id, { text: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label className="label">Подпись как изображение</label>
        <div className="flex gap-2 signature-controls">
          <button
            className="btn btn-secondary"
            onClick={() => onUpdate(el.id, { image: "" })}
          >
            Очистить подпись
          </button>
          <button className="btn btn-secondary" onClick={() => onEdit?.(el.id)}>
            Редактировать подпись
          </button>
          <button className="btn btn-secondary" onClick={uploadImage}>
            Загрузить изображение
          </button>
        </div>
      </div>
    </div>
  );
};

const DividerProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
}> = ({ el, onUpdate }) => {
  const p = el.properties as IDividerProperties;
  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <Minus size={14} />
          Толщина: {p.thickness}px
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={p.thickness}
          onChange={(e) =>
            onUpdate(el.id, { thickness: parseInt(e.target.value) })
          }
          className="input-range"
        />
      </div>
      <div className="form-group">
        <label className="label">Стиль линии</label>
        <select
          className="select"
          value={p.style}
          onChange={(e) => onUpdate(el.id, { style: e.target.value })}
        >
          <option value="solid">Сплошная</option>
          <option value="dashed">Пунктирная</option>
          <option value="dotted">Точечная</option>
        </select>
      </div>
    </div>
  );
};

export default PropertiesPanel;
