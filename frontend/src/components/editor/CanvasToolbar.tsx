import React from "react";
import { Undo2, Redo2, Trash2, FileDown, File } from "lucide-react";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportDocx: () => void;
  onExportHtml: () => void;
  onExportPdf?: () => void;
  gridVisible: boolean;
  gridStep: number;
  onToggleGrid: (v: boolean) => void;
  onGridStepChange: (s: number) => void;
}

const CanvasToolbar: React.FC<Props> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExportDocx,
  onExportHtml,
  onExportPdf,
  gridVisible,
  gridStep,
  onToggleGrid,
  onGridStepChange,
}) => (
  <div className="canvas-toolbar flex-between mb-4">
    <div className="flex gap-2">
      <button
        className="btn btn-secondary"
        onClick={onUndo}
        disabled={!canUndo}
        title="Отменить (Ctrl+Z)"
      >
        <Undo2 size={14} />
        Отменить
      </button>
      <button
        className="btn btn-secondary"
        onClick={onRedo}
        disabled={!canRedo}
        title="Повторить (Ctrl+Y)"
      >
        <Redo2 size={14} />
        Повторить
      </button>
    </div>
    <div className="flex gap-2">
      <div
        className="grid-controls flex gap-2"
        style={{ alignItems: "center" }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={gridVisible}
            onChange={(e) => onToggleGrid(e.target.checked)}
          />
          Сетка
        </label>
        <select
          className="select"
          value={gridStep}
          onChange={(e) => onGridStepChange(parseInt(e.target.value))}
        >
          <option value={8}>8px</option>
          <option value={10}>10px</option>
          <option value={16}>16px</option>
          <option value={20}>20px</option>
          <option value={24}>24px</option>
          <option value={32}>32px</option>
        </select>
      </div>
      <button
        className="btn btn-secondary"
        onClick={onClear}
        title="Очистить холст"
      >
        <Trash2 size={14} />
        Очистить
      </button>
      <button
        className="btn btn-secondary"
        onClick={onExportDocx}
        title="Экспорт DOCX"
      >
        <FileDown size={14} />
        DOCX
      </button>
      <button
        className="btn btn-secondary"
        onClick={onExportHtml}
        title="Экспорт HTML"
      >
        <File size={14} />
        HTML
      </button>
      <button
        className="btn btn-secondary"
        onClick={onExportPdf}
        title="Экспорт PDF"
      >
        <FileDown size={14} />
        PDF
      </button>
    </div>
  </div>
);

export default CanvasToolbar;
