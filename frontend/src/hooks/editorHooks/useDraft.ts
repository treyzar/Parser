import { useEffect } from "react";
import type { IEditorElement } from "../../utils/types/editor.types";

interface IUseDraftProps {
  prefill?: string;
  setElements: (els: IEditorElement[]) => void;
  setTitle: (t: string) => void;
  setDescription: (d: string) => void;
  saveToHistory: (els: IEditorElement[]) => void;
}

export const useDraft = ({
  prefill,
  setElements,
  setTitle,
  setDescription,
  saveToHistory,
}: IUseDraftProps) => {
  useEffect(() => {
    if (prefill) {
      const textEl: IEditorElement = {
        id: `prefill_${Date.now()}`,
        type: "text",
        x: 40,
        y: 40,
        width: 700,
        height: 1000,
        zIndex: 0,
        properties: {
          content: prefill,
          fontFamily: "Inter",
          fontSize: 14,
          color: "#1a1a1a",
          bold: false,
          italic: false,
          underline: false,
          align: "left",
        },
      };
      setElements([textEl]);
      saveToHistory([textEl]);
      return; // пропускаем загрузку черновика
    }

    /* дальше ваш старый код localStorage */
    const raw = localStorage.getItem("editor_draft");
    if (!raw) return;
    try {
      const { elements, title, description } = JSON.parse(raw);
      if (elements?.length) {
        setElements(elements);
        saveToHistory(elements);
      }
      if (title) setTitle(title);
      if (description) setDescription(description);
    } catch {}
  }, [prefill]);
};
