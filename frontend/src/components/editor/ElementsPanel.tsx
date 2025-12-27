import React, { useRef, type JSX } from "react";
import {
  FileText,
  Image,
  TableIcon,
  Calendar,
  Signature,
  Minus,
  Grid3x3,
  Upload,
  Plus,
} from "lucide-react";
import type { TElementType } from "../../utils/types/editor.types";

interface Props {
  onAdd: (t: TElementType) => void;
  onImageUpload: (f: File) => void;
  gridVisible: boolean;
  onToggleGrid: (v: boolean) => void;
  zoom: number;
  autoZoom: number;
  isManualZoom: boolean;
  onZoomChange: (z: number, manual: boolean) => void;
}

const buttons: { type: TElementType; icon: JSX.Element; label: string }[] = [
  { type: "text", icon: <FileText />, label: "Текст" },
  { type: "image", icon: <Image />, label: "Изображение" },
  { type: "table", icon: <TableIcon />, label: "Таблица" },
  { type: "date", icon: <Calendar />, label: "Дата" },
  { type: "signature", icon: <Signature />, label: "Подпись" },
  { type: "divider", icon: <Minus />, label: "Разделитель" },
];

const ElementsPanel: React.FC<Props> = ({
  onAdd,
  onImageUpload,
  gridVisible,
  onToggleGrid,
  zoom,
  autoZoom,
  isManualZoom,
  onZoomChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const curZoom = isManualZoom ? zoom : autoZoom;

  return (
    <div className="panel">
      <h3 className="panel-title">
        <Plus size={16} />
        Элементы
      </h3>
      <div className="element-buttons">
        {buttons.map((b) => (
          <button
            key={b.type}
            className="btn btn-secondary btn-full"
            onClick={() => onAdd(b.type)}
          >
            <span className="btn-icon">{b.icon}</span>
            {b.label}
          </button>
        ))}
      </div>

      <div className="panel-section">
        <label className="label">Загрузить изображение</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) =>
            e.target.files?.[0] && onImageUpload(e.target.files[0])
          }
        />
        <button
          className="btn btn-secondary btn-full"
          onClick={() => fileRef.current?.click()}
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
          <span className="badge">{Math.round(curZoom * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={curZoom}
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

export default ElementsPanel;
