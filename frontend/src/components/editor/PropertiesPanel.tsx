// src/components/editor/PropertiesPanel.tsx

import React, { useState, useEffect } from "react";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
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
  const [tempValues, setTempValues] = useState<{
    x?: string;
    y?: string;
    width?: string;
    height?: string;
  }>({});

  useEffect(() => {
    setTempValues({});
  }, [selected?.id]);

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

  const handleNumberInput = (
    field: "x" | "y" | "width" | "height",
    value: string,
  ) => {
    setTempValues((prev) => ({ ...prev, [field]: value }));

    if (value === "" || isNaN(Number(value))) {
      return;
    }

    const numValue = Number(value);
    let constrainedValue = numValue;

    if (field === "width") {
      constrainedValue = Math.max(50, Math.min(numValue, 794));
    } else if (field === "height") {
      constrainedValue = Math.max(30, Math.min(numValue, 1123));
    } else if (field === "x") {
      constrainedValue = Math.max(0, Math.min(numValue, 794 - selected.width));
    } else if (field === "y") {
      constrainedValue = Math.max(
        0,
        Math.min(numValue, 1123 - selected.height),
      );
    }

    onUpdateEl(selected.id, { [field]: constrainedValue });
  };

  const handleBlur = (field: "x" | "y" | "width" | "height") => {
    if (tempValues[field] === "" || tempValues[field] === undefined) {
      setTempValues((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getDisplayValue = (field: "x" | "y" | "width" | "height") => {
    if (tempValues[field] !== undefined) {
      return tempValues[field];
    }
    return selected[field].toString();
  };

  return (
    <div className="panel">
      <h3 className="panel-title">
        <Settings size={16} />
        Настройки
      </h3>

      {/* Позиция и размер */}
      <div className="properties-grid">
        <div className="form-group">
          <label className="label">Позиция X</label>
          <input
            type="number"
            className="input"
            value={getDisplayValue("x")}
            onChange={(e) => handleNumberInput("x", e.target.value)}
            onBlur={() => handleBlur("x")}
            min="0"
            max="794"
            step="1"
          />
        </div>
        <div className="form-group">
          <label className="label">Позиция Y</label>
          <input
            type="number"
            className="input"
            value={getDisplayValue("y")}
            onChange={(e) => handleNumberInput("y", e.target.value)}
            onBlur={() => handleBlur("y")}
            min="0"
            max="1123"
            step="1"
          />
        </div>
        <div className="form-group">
          <label className="label">Ширина</label>
          <input
            type="number"
            className="input"
            value={getDisplayValue("width")}
            onChange={(e) => handleNumberInput("width", e.target.value)}
            onBlur={() => handleBlur("width")}
            min="50"
            max="794"
            step="1"
          />
        </div>
        <div className="form-group">
          <label className="label">Высота</label>
          <input
            type="number"
            className="input"
            value={getDisplayValue("height")}
            onChange={(e) => handleNumberInput("height", e.target.value)}
            onBlur={() => handleBlur("height")}
            min="30"
            max="1123"
            step="1"
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

      {/* Действия */}
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

/* ========== TEXT PROPS (ОБНОВЛЁННЫЙ) ========== */
const TextProps: React.FC<{
  el: IEditorElement;
  onUpdate: (id: string, p: any) => void;
}> = ({ el, onUpdate }) => {
  const p = el.properties as ITextProperties;
  const [tempFontSize, setTempFontSize] = useState<string | undefined>();

  const handleFontSizeChange = (value: string) => {
    setTempFontSize(value);
    if (value === "" || isNaN(Number(value))) return;
    const numValue = Math.max(8, Math.min(Number(value), 72));
    onUpdate(el.id, { fontSize: numValue });
  };

  return (
    <div className="properties-section">
      {/* Текст (textarea для многострочного ввода) */}
      <div className="form-group">
        <label className="label">
          <Type size={14} />
          Текст
        </label>
        <textarea
          className="input textarea"
          rows={4}
          value={p.content}
          onChange={(e) => onUpdate(el.id, { content: e.target.value })}
          placeholder="Введите текст...&#10;Используйте Enter для новой строки"
          style={{ resize: "vertical", minHeight: 80 }}
        />
        <small className="input-hint">
          Enter — новый абзац, Shift+Enter — перенос строки
        </small>
      </div>

      {/* Шрифт */}
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

      {/* Размер шрифта */}
      <div className="form-group">
        <label className="label">Размер шрифта: {p.fontSize}px</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="8"
            max="72"
            value={p.fontSize}
            onChange={(e) =>
              onUpdate(el.id, { fontSize: parseInt(e.target.value) })
            }
            className="input-range flex-1"
          />
          <input
            type="number"
            className="input w-16"
            value={tempFontSize ?? p.fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            onBlur={() => setTempFontSize(undefined)}
            min="8"
            max="72"
          />
        </div>
      </div>

      {/* Цвет */}
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

      {/* Стили текста */}
      <div className="form-group">
        <label className="label">Стиль текста</label>
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
            <span>Подчёркнутый</span>
          </label>
        </div>
      </div>

      {/* Выравнивание */}
      <div className="form-group">
        <label className="label">Выравнивание</label>
        <div className="align-buttons">
          {(["left", "center", "right", "justify"] as const).map((align) => (
            <button
              key={align}
              type="button"
              className={`align-btn ${p.align === align ? "active" : ""}`}
              onClick={() => onUpdate(el.id, { align })}
              title={
                align === "left"
                  ? "По левому краю"
                  : align === "center"
                    ? "По центру"
                    : align === "right"
                      ? "По правому краю"
                      : "По ширине"
              }
            >
              {align === "left" && <AlignLeft size={16} />}
              {align === "center" && <AlignCenter size={16} />}
              {align === "right" && <AlignRight size={16} />}
              {align === "justify" && <AlignJustify size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* === НОВЫЙ РАЗДЕЛ: Параграф === */}
      <div className="form-group">
        <label className="label section-label">
          <IndentIncrease size={14} />
          Параграф
        </label>
      </div>

      {/* Красная строка */}
      <div className="form-group">
        <label className="label">Красная строка: {p.textIndent || 0}px</label>
        <input
          type="range"
          min="0"
          max="80"
          step="5"
          value={p.textIndent || 0}
          onChange={(e) =>
            onUpdate(el.id, { textIndent: parseInt(e.target.value) })
          }
          className="input-range"
        />
        <div className="preset-buttons">
          <button
            type="button"
            className={`preset-btn ${(p.textIndent || 0) === 0 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { textIndent: 0 })}
          >
            Нет
          </button>
          <button
            type="button"
            className={`preset-btn ${p.textIndent === 25 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { textIndent: 25 })}
          >
            25px
          </button>
          <button
            type="button"
            className={`preset-btn ${p.textIndent === 40 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { textIndent: 40 })}
          >
            40px
          </button>
          <button
            type="button"
            className={`preset-btn ${p.textIndent === 60 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { textIndent: 60 })}
          >
            60px
          </button>
        </div>
      </div>

      {/* Межстрочный интервал */}
      <div className="form-group">
        <label className="label">
          Межстрочный интервал: {(p.lineHeight || 1.5).toFixed(1)}
        </label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={p.lineHeight || 1.5}
          onChange={(e) =>
            onUpdate(el.id, { lineHeight: parseFloat(e.target.value) })
          }
          className="input-range"
        />
        <div className="preset-buttons">
          <button
            type="button"
            className={`preset-btn ${(p.lineHeight || 1.5) === 1 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { lineHeight: 1 })}
          >
            1.0
          </button>
          <button
            type="button"
            className={`preset-btn ${(p.lineHeight || 1.5) === 1.5 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { lineHeight: 1.5 })}
          >
            1.5
          </button>
          <button
            type="button"
            className={`preset-btn ${(p.lineHeight || 1.5) === 2 ? "active" : ""}`}
            onClick={() => onUpdate(el.id, { lineHeight: 2 })}
          >
            2.0
          </button>
        </div>
      </div>

      {/* Отступ между абзацами */}
      <div className="form-group">
        <label className="label">
          Отступ между абзацами: {p.paragraphSpacing || 0}px
        </label>
        <input
          type="range"
          min="0"
          max="40"
          step="2"
          value={p.paragraphSpacing || 0}
          onChange={(e) =>
            onUpdate(el.id, { paragraphSpacing: parseInt(e.target.value) })
          }
          className="input-range"
        />
      </div>

      {/* Перенос текста */}
      <div className="form-group">
        <label className="label">Перенос текста</label>
        <select
          className="select"
          value={p.whiteSpace || "pre-wrap"}
          onChange={(e) => onUpdate(el.id, { whiteSpace: e.target.value })}
        >
          <option value="pre-wrap">Авто (сохранять переносы)</option>
          <option value="normal">Авто (схлопывать пробелы)</option>
          <option value="nowrap">Без переноса</option>
          <option value="pre-line">Сохранять только переносы</option>
        </select>
      </div>

      {/* Перенос слов */}
      <div className="form-group">
        <label className="label">Перенос длинных слов</label>
        <select
          className="select"
          value={p.wordBreak || "break-word"}
          onChange={(e) => onUpdate(el.id, { wordBreak: e.target.value })}
        >
          <option value="normal">Обычный</option>
          <option value="break-word">По словам</option>
          <option value="break-all">По символам</option>
          <option value="keep-all">Не разрывать</option>
        </select>
      </div>

      {/* Стили для новых элементов */}
      <style>{`
        .section-label {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--c-bg-300);
          font-weight: 600;
        }
        
        .align-buttons {
          display: flex;
          gap: 4px;
        }
        
        .align-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 1px solid var(--c-bg-300);
          border-radius: var(--radius-sm);
          background: var(--c-bg-100);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .align-btn:hover {
          background: var(--c-bg-200);
        }
        
        .align-btn.active {
          background: var(--c-accent);
          border-color: var(--c-accent);
          color: white;
        }
        
        .preset-buttons {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }
        
        .preset-btn {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--c-bg-300);
          border-radius: var(--radius-sm);
          background: var(--c-bg-100);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .preset-btn:hover {
          background: var(--c-bg-200);
        }
        
        .preset-btn.active {
          background: var(--c-accent);
          border-color: var(--c-accent);
          color: white;
        }
        
        .input-hint {
          display: block;
          font-size: 11px;
          color: #888;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

/* ========== Остальные компоненты без изменений ========== */

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
  const [selectedRow, setSelectedRow] = React.useState(0);
  const [selectedCol, setSelectedCol] = React.useState(0);

  // Инициализируем cellTextColors, если его нет
  React.useEffect(() => {
    if (!p.cellTextColors) {
      const colors = Array(p.rows)
        .fill(null)
        .map(() => Array(p.cols).fill("#000000"));
      onUpdate(el.id, { cellTextColors: colors });
    }
  }, [p.rows, p.cols]);

  const handleCellColorChange = (color: string) => {
    const colors = [...(p.cellTextColors || [])];
    // Убеждаемся, что массив имеет правильный размер
    while (colors.length < p.rows) {
      colors.push(Array(p.cols).fill("#000000"));
    }
    colors.forEach((row) => {
      while (row.length < p.cols) {
        row.push("#000000");
      }
    });

    if (!colors[selectedRow]) {
      colors[selectedRow] = Array(p.cols).fill("#000000");
    }
    colors[selectedRow][selectedCol] = color;
    onUpdate(el.id, { cellTextColors: colors });
  };

  const currentCellColor =
    p.cellTextColors?.[selectedRow]?.[selectedCol] || "#000000";

  return (
    <div className="properties-section">
      <div className="form-group">
        <label className="label">
          <TableIcon size={14} />
          Строки
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="1"
            max="10"
            value={p.rows}
            onChange={(e) =>
              onUpdate(el.id, { rows: parseInt(e.target.value) })
            }
            className="input-range flex-1"
          />
          <input
            type="number"
            className="input w-16"
            value={p.rows}
            onChange={(e) =>
              onUpdate(el.id, { rows: parseInt(e.target.value) || 1 })
            }
            min="1"
            max="10"
          />
        </div>
      </div>
      <div className="form-group">
        <label className="label">Столбцы</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="1"
            max="10"
            value={p.cols}
            onChange={(e) =>
              onUpdate(el.id, { cols: parseInt(e.target.value) })
            }
            className="input-range flex-1"
          />
          <input
            type="number"
            className="input w-16"
            value={p.cols}
            onChange={(e) =>
              onUpdate(el.id, { cols: parseInt(e.target.value) || 1 })
            }
            min="1"
            max="10"
          />
        </div>
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
        <label className="label">Цвет текста ячейки</label>
        <div className="flex gap-2 items-center mb-2">
          <select
            className="input flex-1"
            value={selectedRow}
            onChange={(e) => setSelectedRow(parseInt(e.target.value))}
          >
            {Array.from({ length: p.rows }).map((_, i) => (
              <option key={i} value={i}>
                Строка {i + 1}
              </option>
            ))}
          </select>
          <select
            className="input flex-1"
            value={selectedCol}
            onChange={(e) => setSelectedCol(parseInt(e.target.value))}
          >
            {Array.from({ length: p.cols }).map((_, i) => (
              <option key={i} value={i}>
                Колонка {i + 1}
              </option>
            ))}
          </select>
        </div>
        <input
          type="color"
          className="input w-full"
          value={currentCellColor}
          onChange={(e) => handleCellColorChange(e.target.value)}
        />
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
            Очистить
          </button>
          <button className="btn btn-secondary" onClick={() => onEdit?.(el.id)}>
            Редактировать
          </button>
          <button className="btn btn-secondary" onClick={uploadImage}>
            Загрузить
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
          Толщина
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="1"
            max="5"
            value={p.thickness}
            onChange={(e) =>
              onUpdate(el.id, { thickness: parseInt(e.target.value) })
            }
            className="input-range flex-1"
          />
          <input
            type="number"
            className="input w-16"
            value={p.thickness}
            onChange={(e) =>
              onUpdate(el.id, { thickness: parseInt(e.target.value) || 1 })
            }
            min="1"
            max="5"
          />
        </div>
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
