/* ===== TYPE-ALIASES ===== */
export type TTemplateType = "HTML" | "DOCX";
export type TVisibilityType = "PUBLIC" | "RESTRICTED";
export type TElementType =
  | "text"
  | "image"
  | "table"
  | "date"
  | "signature"
  | "divider";
export type TAlignType = "left" | "center" | "right";
export type TDividerStyle = "solid" | "dashed" | "dotted";
export type TDocSection =
  | "hotkeys"
  | "elements"
  | "work"
  | "tables"
  | "export"
  | "copy";

/* ===== INTERFACES ===== */
export interface ITextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TAlignType;
}

export interface IImageProperties {
  src: string;
  alt: string;
  file?: File;
}

export interface ITableProperties {
  rows: number;
  cols: number;
  borderWidth: number;
  borderColor: string;
  cellBg: string;
  data: string[][];
}

export interface IDateProperties {
  format: string;
  value: string;
}

export interface ISignatureProperties {
  text: string;
  fontSize: number;
  color: string;
}

export interface IDividerProperties {
  thickness: number;
  color: string;
  style: TDividerStyle;
}

export type TElementProperties =
  | ITextProperties
  | IImageProperties
  | ITableProperties
  | IDateProperties
  | ISignatureProperties
  | IDividerProperties;

export interface IEditorElement {
  id: string;
  type: TElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  properties: TElementProperties;
}

export interface IHistoryState {
  elements: IEditorElement[];
  timestamp: number;
}

/* ===== пропсы компонентов (пример) ===== */
export interface ICanvasProps {
  elements: IEditorElement[];
  selectedId: string | null;
  gridVisible: boolean;
  zoom: number;
  onSelect: (id: string | null) => void;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onUpdateProp: (id: string, p: Partial<TElementProperties>) => void;
}
