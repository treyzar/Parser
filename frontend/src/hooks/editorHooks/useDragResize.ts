// src/hooks/editorHooks/useDragResize.ts
import { useState } from "react";
import type { IEditorElement } from "../../utils/types/editor.types";

interface DragResizeHook {
  isDragging: boolean;
  isResizing: boolean;
  dragOffset: { x: number; y: number };
  resizeHandle: string;
  startDrag: (id: string, offsetX: number, offsetY: number) => void;
  startResize: (id: string, handle: string) => void;
  stopDragResize: () => void;
}

export const useDragResize = (
  _elements: IEditorElement[],
  _selectedId: string | null,
  _updateElement: (id: string, upd: Partial<IEditorElement>) => void,
  _snapToGrid: (v: number) => number
): DragResizeHook => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState("");

  // FIX: Новые сигнатуры без события
  const startDrag = (_id: string, offsetX: number, offsetY: number) => {
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  const startResize = (_id: string, handle: string) => {
    setResizeHandle(handle);
    setIsResizing(true);
  };

  const stopDragResize = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  };

  return {
    isDragging,
    isResizing,
    dragOffset,
    resizeHandle,
    startDrag,
    startResize,
    stopDragResize,
  };
};
