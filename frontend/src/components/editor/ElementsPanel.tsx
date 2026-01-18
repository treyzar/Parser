// src/components/editor/ElementsPanel.tsx

import React, { useRef } from "react";
import {
  FileText,
  Image as ImageIcon,
  Table as TableIcon,
  PenTool,
  Minus,
  Upload,
  Plus,
  ZoomIn,
  RotateCcw,
  Grid,
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

const buttons: { type: TElementType; icon: React.ReactNode; label: string }[] =
  [
    { type: "text", icon: <FileText size={20} />, label: "Текст" },
    { type: "image", icon: <ImageIcon size={20} />, label: "Картинка" },
    { type: "table", icon: <TableIcon size={20} />, label: "Таблица" },
    { type: "signature", icon: <PenTool size={20} />, label: "Подпись" },
    { type: "divider", icon: <Minus size={20} />, label: "Линия" },
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

  // Текущий отображаемый зум
  const displayZoom = zoom;
  const zoomPercent = Math.round(displayZoom * 100);

  // Пресеты масштаба
  const zoomPresets = [0.5, 0.75, 1, 1.25, 1.5];

  // Обработчик изменения зума через слайдер
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    console.log("📊 Slider value:", value); // Debug
    onZoomChange(value, true); // true = manual
  };

  // Обработчик пресетов
  const handlePresetClick = (preset: number) => {
    console.log("🎯 Preset clicked:", preset); // Debug
    onZoomChange(preset, true);
  };

  // Сброс зума
  const handleResetZoom = () => {
    console.log("🔄 Reset zoom to auto:", autoZoom); // Debug
    onZoomChange(autoZoom, false); // false = auto mode
  };

  return (
    <div className="panel-content">
      {/* Секция добавления элементов */}
      <div className="panel-section">
        <h4 className="panel-subtitle">
          <Plus size={14} />
          Добавить элемент
        </h4>
        <div className="element-grid">
          {buttons.map((b) => (
            <button
              key={b.type}
              className="btn btn-secondary btn-element"
              onClick={() => onAdd(b.type)}
              title={`Добавить ${b.label}`}
            >
              <div className="element-icon">{b.icon}</div>
              <span className="element-label">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Загрузка изображения */}
      <div className="panel-section">
        <h4 className="panel-subtitle">
          <Upload size={14} />
          Загрузка
        </h4>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onImageUpload(e.target.files[0]);
              e.target.value = "";
            }
          }}
        />
        <button
          className="btn btn-secondary btn-full"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={16} />
          Загрузить изображение
        </button>
      </div>

      {/* Секция масштаба */}
      <div className="panel-section zoom-section">
        <div className="zoom-header">
          <h4 className="panel-subtitle mb-0">
            <ZoomIn size={14} />
            Масштаб
          </h4>
          <span className="zoom-value">{zoomPercent}%</span>
        </div>

        {/* Слайдер */}
        <div className="zoom-slider-container">
          <span className="zoom-label-min">50%</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={displayZoom}
            onChange={handleSliderChange}
            className="zoom-slider"
          />
          <span className="zoom-label-max">200%</span>
        </div>

        {/* Пресеты */}
        <div className="zoom-presets">
          {zoomPresets.map((preset) => (
            <button
              key={preset}
              className={`zoom-preset-btn ${
                Math.abs(displayZoom - preset) < 0.03 ? "active" : ""
              }`}
              onClick={() => handlePresetClick(preset)}
            >
              {Math.round(preset * 100)}%
            </button>
          ))}
        </div>

        {/* Кнопка сброса */}
        {isManualZoom && (
          <button
            className="btn btn-ghost btn-full btn-reset"
            onClick={handleResetZoom}
          >
            <RotateCcw size={14} />
            Сбросить (Авто: {Math.round(autoZoom * 100)}%)
          </button>
        )}
      </div>

      {/* Сетка */}
      <div className="panel-section">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={(e) => onToggleGrid(e.target.checked)}
          />
          <Grid size={14} />
          <span>Показать сетку</span>
        </label>
      </div>

      <style>{`
        .panel-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .panel-section {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--c-bg-200, #e5e7eb);
        }
        
        .panel-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .panel-subtitle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--c-ink-light, #6b7280);
          margin-bottom: 12px;
        }
        
        .mb-0 { margin-bottom: 0 !important; }
        
        .element-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .btn-element {
          flex-direction: column;
          gap: 6px;
          padding: 14px 8px;
          height: auto;
          min-height: 72px;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        
        .btn-element:hover {
          background: var(--c-accent, #e73f0c);
          color: white;
          transform: translateY(-1px);
        }
        
        .btn-element:hover .element-icon {
          color: white;
        }
        
        .element-icon {
          color: var(--c-accent, #e73f0c);
          transition: color 0.15s ease;
        }
        
        .element-label {
          font-size: 11px;
          font-weight: 500;
        }
        
        .btn-full {
          width: 100%;
          justify-content: center;
          gap: 8px;
        }

        /* Zoom Section */
        .zoom-section {
          background: var(--c-bg-100, #f9fafb);
          margin: 0 -16px;
          padding: 16px;
          border-radius: 0;
        }
        
        .zoom-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .zoom-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--c-accent, #e73f0c);
          background: rgba(231, 63, 12, 0.1);
          padding: 4px 12px;
          border-radius: 6px;
          min-width: 60px;
          text-align: center;
        }
        
        .zoom-slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        
        .zoom-label-min,
        .zoom-label-max {
          font-size: 10px;
          color: var(--c-ink-light, #6b7280);
          min-width: 28px;
        }
        
        .zoom-label-max {
          text-align: right;
        }
        
        .zoom-slider {
          flex: 1;
          height: 6px;
          appearance: none;
          -webkit-appearance: none;
          background: var(--c-bg-300, #d1d5db);
          border-radius: 3px;
          cursor: pointer;
          outline: none;
        }
        
        .zoom-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--c-accent, #e73f0c);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        
        .zoom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 12px rgba(231, 63, 12, 0.4);
        }
        
        .zoom-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--c-accent, #e73f0c);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .zoom-presets {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        
        .zoom-preset-btn {
          flex: 1;
          padding: 8px 4px;
          font-size: 11px;
          font-weight: 600;
          background: var(--c-bg-50, white);
          border: 1px solid var(--c-bg-300, #d1d5db);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .zoom-preset-btn:hover {
          border-color: var(--c-accent, #e73f0c);
          color: var(--c-accent, #e73f0c);
        }
        
        .zoom-preset-btn.active {
          background: var(--c-accent, #e73f0c);
          color: white;
          border-color: var(--c-accent, #e73f0c);
        }
        
        .btn-reset {
          font-size: 12px;
          color: var(--c-ink-light, #6b7280);
          gap: 6px;
        }
        
        .btn-reset:hover {
          color: var(--c-ink, #374151);
          background: var(--c-bg-200, #e5e7eb);
        }
        
        /* Toggle */
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 0;
        }
        
        .toggle-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--c-accent, #e73f0c);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ElementsPanel;
