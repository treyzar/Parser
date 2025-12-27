import type { TElementType, IEditorElement } from "../types/editor.types";
import { A4_HEIGHT, A4_WIDTH } from "../constants/editor.constants";

export function createDefaultElement(
  type: TElementType,
  id: string,
  snap: (v: number) => number
): IEditorElement {
  const base = {
    id,
    x: snap(A4_WIDTH / 2 - 150),
    y: snap(A4_HEIGHT / 2 - 100),
    zIndex: 0,
  };

  if (type === "text")
    return {
      ...base,
      type,
      width: 300,
      height: 80,
      properties: {
        content: "Новый текст",
        fontFamily: "Inter",
        fontSize: 14,
        color: "#1a1a1a",
        bold: false,
        italic: false,
        underline: false,
        align: "left",
      },
    };

  if (type === "image")
    return {
      ...base,
      type,
      width: 250,
      height: 200,
      properties: { src: "", alt: "Image" },
    };

  if (type === "table")
    return {
      ...base,
      type,
      width: 400,
      height: 200,
      properties: {
        rows: 3,
        cols: 3,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        cellBg: "transparent",
        data: Array(3)
          .fill(null)
          .map(() => Array(3).fill("")),
      },
    };

  if (type === "date")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: {
        format: "DD.MM.YYYY",
        value: new Date().toISOString().split("T")[0],
      },
    };

  if (type === "signature")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: { text: "Подпись", fontSize: 16, color: "#1a1a1a" },
    };

  if (type === "divider")
    return {
      ...base,
      type,
      width: 150,
      height: 40,
      properties: { thickness: 1, color: "#1a1a1a", style: "solid" as const },
    };

  throw new Error("Unknown element type");
}
