import { useState, useCallback } from "react";
import type {
  IEditorElement,
  IHistoryState,
} from "../../utils/types/editor.types";

interface IUseHistoryReturn {
  history: IHistoryState[];
  index: number;
  saveToHistory: (els: IEditorElement[]) => void;
  undo: () => IEditorElement[];
  redo: () => IEditorElement[];
  canUndo: boolean;
  canRedo: boolean;
}

export const useHistory = (initial: IEditorElement[]): IUseHistoryReturn => {
  const [history, setHistory] = useState<IHistoryState[]>([
    { elements: structuredClone(initial), timestamp: Date.now() },
  ]);
  const [index, setIndex] = useState(0);

  const saveToHistory = useCallback(
    (els: IEditorElement[]) => {
      const newState: IHistoryState = {
        elements: structuredClone(els),
        timestamp: Date.now(),
      };
      setHistory((prev) => {
        const sliced = prev.slice(0, index + 1);
        const next = [...sliced, newState];
        if (next.length > 50) next.shift();
        return next;
      });
      setIndex((i) => Math.min(i + 1, 49));
    },
    [index]
  );

  const undo = (): IEditorElement[] => {
    if (index === 0) return history[0].elements;
    const newIdx = index - 1;
    setIndex(newIdx);
    return history[newIdx].elements;
  };

  const redo = (): IEditorElement[] => {
    if (index === history.length - 1) return history[index].elements;
    const newIdx = index + 1;
    setIndex(newIdx);
    return history[newIdx].elements;
  };

  return {
    history,
    index,
    saveToHistory,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
