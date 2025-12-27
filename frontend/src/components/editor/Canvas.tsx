// src/components/editor/Canvas.tsx
import React, { forwardRef } from "react";
import type { IEditorElement } from "../../utils/types/editor.types";
import { ElementRenderer } from "./ElementRenderer";
import ResizeHandles from "./ResizeHandles";

interface CanvasProps {
  elements: IEditorElement[];
  selectedId: string | null;
  gridVisible: boolean;
  zoom: number;
  gridStep?: number;
  onSelect: (id: string | null) => void;
  onElementMoveStart: (id: string, offsetX: number, offsetY: number) => void;
  onElementResizeStart: (id: string, handle: string) => void;
  onUpdateProp: (id: string, props: any) => void;
  onImageUpload: (file: File) => void;
  onEditSignature?: (id: string) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(function CanvasComponent(
  {
    elements,
    selectedId,
    gridVisible,
    zoom,
    gridStep = 20,
    onSelect,
    onElementMoveStart,
    onElementResizeStart,
    onUpdateProp,
    onImageUpload,
    onEditSignature,
  },
  ref
) {
  // FIX: Соответствуем сигнатуре useDragResize
  const handleElementMouseDown = (
    e: React.MouseEvent,
    element: IEditorElement,
    handle?: string
  ) => {
    // compute offset relative to element's top-left in canvas coordinates
    const canvasEl = (e.currentTarget as HTMLElement).closest(
      ".canvas"
    ) as HTMLElement | null;
    const canvasRect = canvasEl?.getBoundingClientRect();
    const offsetX = canvasRect
      ? (e.clientX - canvasRect.left) / zoom - element.x
      : 0;
    const offsetY = canvasRect
      ? (e.clientY - canvasRect.top) / zoom - element.y
      : 0;

    if (handle) {
      e.stopPropagation();
      onElementResizeStart(element.id, handle);
    } else {
      onElementMoveStart(element.id, offsetX, offsetY);
    }
  };

  return (
    <div
      ref={ref}
      className="canvas"
      style={{
        width: 794,
        height: 1123,
        transform: `scale(${zoom})`,
        transformOrigin: "top left",
        backgroundColor: "var(--c-bg-100)",
        backgroundImage: gridVisible
          ? `linear-gradient(to right, var(--c-grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--c-grid-color) 1px, transparent 1px)`
          : undefined,
        backgroundSize: gridVisible ? `${gridStep}px ${gridStep}px` : undefined,
      }}
      onClick={() => onSelect(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith("image/")) {
          onImageUpload(file);
        }
      }}
    >
      {elements.map((el) => (
        <React.Fragment key={el.id}>
          <ElementRenderer
            element={el}
            isSelected={el.id === selectedId}
            onSelect={() => onSelect(el.id)}
            onMouseDown={(e, _id, handle) =>
              handleElementMouseDown(e, el, handle)
            }
            onEditSignature={onEditSignature}
            onUpdateProp={onUpdateProp}
          />
          {el.id === selectedId && (
            <ResizeHandles
              element={el}
              zoom={zoom}
              onMouseDown={(e, element, handle) =>
                handleElementMouseDown(e, element, handle)
              }
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
