// src/components/editor/Canvas/ResizeHandles.tsx
import React from "react";
import type { IEditorElement } from "../../utils/types/editor.types";

interface ResizeHandlesProps {
  element: IEditorElement;
  zoom: number;
  onMouseDown: (
    e: React.MouseEvent,
    element: IEditorElement,
    handle: string
  ) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  element,
  zoom,
  onMouseDown,
}) => {
  const size = 8;

  // Функция для создания стилей каждого handle
  const handleStyle = (
    cursor: string,
    position: { left?: number; right?: number; top?: number; bottom?: number }
  ) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    background: "var(--c-accent)",
    border: "2px solid white",
    borderRadius: "50%",
    cursor,
    // FIX: Корректируем размер при масштабе, чтобы видимый размер оставался постоянным
    transform: `scale(${1 / zoom})`,
    transformOrigin: "center",
    pointerEvents: "auto" as const,
    zIndex: 1001,
    ...position,
  });

  // Контейнер для handles — позиционируется в тех же координатах, что и элемент
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    pointerEvents: "none",
    transform: "translate(0, 0)",
  };

  return (
    <div style={containerStyle}>
      {/* top-left */}
      <div
        style={handleStyle("nw-resize", { left: -size / 2, top: -size / 2 })}
        onMouseDown={(e) => onMouseDown(e, element, "nw")}
      />
      {/* top-right */}
      <div
        style={handleStyle("ne-resize", { right: -size / 2, top: -size / 2 })}
        onMouseDown={(e) => onMouseDown(e, element, "ne")}
      />
      {/* bottom-left */}
      <div
        style={handleStyle("sw-resize", { left: -size / 2, bottom: -size / 2 })}
        onMouseDown={(e) => onMouseDown(e, element, "sw")}
      />
      {/* bottom-right */}
      <div
        style={handleStyle("se-resize", {
          right: -size / 2,
          bottom: -size / 2,
        })}
        onMouseDown={(e) => onMouseDown(e, element, "se")}
      />
    </div>
  );
};

export default ResizeHandles;
