import { useEffect } from "react";
import type { IEditorElement } from "../../utils/types/editor.types";

interface IUseKeyboardProps {
  selectedId: string | null;
  elements: IEditorElement[];
  setElements: (els: IEditorElement[]) => void;
  saveToHistory: (els: IEditorElement[]) => void;
  setSelectedId: (id: string | null) => void;
  deleteElement: (id: string) => void;
  undo: () => IEditorElement[];
  redo: () => IEditorElement[];
}

export const useKeyboard = ({
  selectedId,
  elements,
  setElements,
  saveToHistory,
  setSelectedId,
  deleteElement,
  undo,
  redo,
}: IUseKeyboardProps): void => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setElements(undo());
        setSelectedId(null);
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        setElements(redo());
        setSelectedId(null);
      }
      if (e.key === "Delete" && selectedId) {
        e.preventDefault();
        deleteElement(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedId) {
        const el = elements.find((i) => i.id === selectedId);
        if (el) navigator.clipboard.writeText(JSON.stringify(el));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        navigator.clipboard.readText().then((str) => {
          try {
            const copied: IEditorElement = JSON.parse(str);
            if (!copied.id || !copied.type) return;
            const newEl: IEditorElement = {
              ...copied,
              id: `el_${Date.now()}`,
              x: copied.x + 20,
              y: copied.y + 20,
            };
            const next = [...elements, newEl];
            setElements(next);
            saveToHistory(next);
            setSelectedId(newEl.id);
          } catch {}
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    elements,
    setElements,
    saveToHistory,
    setSelectedId,
    deleteElement,
    undo,
    redo,
  ]);
};
