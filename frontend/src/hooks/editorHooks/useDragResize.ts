import { useCallback, useRef, useState } from "react";
import type { IEditorElement } from "../../utils/types/editor.types";

interface DragResizeHook {
  isDragging: boolean;
  isResizing: boolean;
  startDrag: (id: string, offsetX: number, offsetY: number) => void;
  startResize: (id: string, handle: string) => void;
  stopDragResize: () => void;
  // Мы возвращаем refs наружу, если нужно, но в основном используем handleMouseMove
  handleMouseMove: (
    e: MouseEvent,
    canvasRect: DOMRect,
    zoom: number,
    elements: IEditorElement[], // Передаем актуальные элементы
    selectedId: string | null,
    updateElement: (id: string, upd: Partial<IEditorElement>) => void, // Быстрая функция обновления
    snapToGrid: (v: number, gs?: number) => number,
    gridSize: number
  ) => void;
  // Геттеры для UI, чтобы знать, какой курсор показывать
  resizeHandle: string;
}

export const useDragResize = (): DragResizeHook => {
  // Состояние только для UI (чтобы перерисовать курсор или рамку)
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isResizingState, setIsResizingState] = useState(false);
  const [resizeHandleState, setResizeHandleState] = useState("");

  // Refs для логики (мгновенный доступ без ре-рендеров)
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeHandle = useRef("");

  const startDrag = useCallback(
    (_id: string, offsetX: number, offsetY: number) => {
      dragOffset.current = { x: offsetX, y: offsetY };
      isDragging.current = true;
      setIsDraggingState(true); // Для UI
    },
    []
  );

  const startResize = useCallback((_id: string, handle: string) => {
    resizeHandle.current = handle;
    isResizing.current = true;

    setIsResizingState(true); // Для UI
    setResizeHandleState(handle);
  }, []);

  const stopDragResize = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
    resizeHandle.current = "";

    setIsDraggingState(false);
    setIsResizingState(false);
    setResizeHandleState("");
  }, []);

  const handleMouseMove = useCallback(
    (
      e: MouseEvent,
      canvasRect: DOMRect,
      zoom: number,
      elements: IEditorElement[],
      selectedId: string | null,
      updateElement: (id: string, upd: Partial<IEditorElement>) => void,
      snapToGrid: (v: number, gs?: number) => number,
      gridSize: number
    ) => {
      if (!selectedId || (!isDragging.current && !isResizing.current)) return;

      const el = elements.find((i) => i.id === selectedId);
      if (!el) return;

      // Координаты мыши относительно канваса (с учетом зума)
      const x = (e.clientX - canvasRect.left) / zoom;
      const y = (e.clientY - canvasRect.top) / zoom;

      // --- ЛОГИКА ПЕРЕТАСКИВАНИЯ ---
      if (isDragging.current) {
        // Вычисляем новую позицию
        let nx = x - dragOffset.current.x;
        let ny = y - dragOffset.current.y;

        // Применяем сетку
        nx = snapToGrid(nx, gridSize);
        ny = snapToGrid(ny, gridSize);

        // Ограничиваем границами листа (794x1123 - A4 px)
        const constrainedX = Math.max(0, Math.min(nx, 794 - el.width));
        const constrainedY = Math.max(0, Math.min(ny, 1123 - el.height));

        // Вызываем обновление только если координаты изменились
        if (el.x !== constrainedX || el.y !== constrainedY) {
          updateElement(selectedId, { x: constrainedX, y: constrainedY });
        }
      }

      // --- ЛОГИКА ИЗМЕНЕНИЯ РАЗМЕРА ---
      if (isResizing.current) {
        let width = el.width;
        let height = el.height;
        let newX = el.x;
        let newY = el.y;

        const handle = resizeHandle.current;

        if (handle.includes("right")) {
          width = snapToGrid(x - el.x, gridSize);
        }
        if (handle.includes("bottom")) {
          height = snapToGrid(y - el.y, gridSize);
        }
        if (handle.includes("left")) {
          const rightEdge = el.x + el.width;
          const desiredLeft = snapToGrid(x, gridSize);
          // Не даем ширине стать меньше 50
          if (rightEdge - desiredLeft >= 50) {
            newX = desiredLeft;
            width = rightEdge - desiredLeft;
          }
        }
        if (handle.includes("top")) {
          const bottomEdge = el.y + el.height;
          const desiredTop = snapToGrid(y, gridSize);
          // Не даем высоте стать меньше 30
          if (bottomEdge - desiredTop >= 30) {
            newY = desiredTop;
            height = bottomEdge - desiredTop;
          }
        }

        updateElement(selectedId, {
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: Math.max(50, width),
          height: Math.max(30, height),
        });
      }
    },
    []
  );

  return {
    isDragging: isDraggingState,
    isResizing: isResizingState,
    resizeHandle: resizeHandleState,
    startDrag,
    startResize,
    stopDragResize,
    handleMouseMove,
  };
};
