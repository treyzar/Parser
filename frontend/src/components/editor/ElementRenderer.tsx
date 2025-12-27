import React from "react";
import type {
  IEditorElement,
  ITextProperties,
  IImageProperties,
  ITableProperties,
  IDateProperties,
  ISignatureProperties,
  IDividerProperties,
} from "../../utils/types/editor.types";

interface IElementRendererProps {
  element: IEditorElement;
  isSelected: boolean;
  onSelect: () => void;
  onMouseDown: (e: React.MouseEvent, id: string, handle?: string) => void;
  onUpdateProp: (id: string, props: any) => void;
  onEditSignature?: (id: string) => void;
  // optional helper to request file upload (kept for future use)
}

export const ElementRenderer: React.FC<IElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onMouseDown,
  onUpdateProp,
  onEditSignature,
}) => {
  const createFileInputAndRead = (
    callback: (file: File, dataUrl: string) => void
  ) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        callback(f, src);
      };
      reader.readAsDataURL(f);
    };
    inp.click();
  };
  const commonStyle: React.CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    border: isSelected ? "2px solid var(--c-accent)" : "2px solid transparent",
    cursor: "move",
    transition: "all 0.1s ease-out",
    // FIX: border не должен влиять на размер
    boxSizing: "border-box",
    // FIX: создаём новый контекст позиционирования
    transform: "translate(0, 0)",
    zIndex: (element as any).zIndex ?? 0,
  };

  // FIX: unified обработчик для предотвращения конфликтов
  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.stopPropagation();
    onMouseDown(e, element.id, handle);
  };

  if (element.type === "text") {
    const props = element.properties as ITextProperties;
    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={handleMouseDown}
        className="text-element"
      >
        <p
          style={{
            margin: 0,
            fontFamily: props.fontFamily,
            fontSize: props.fontSize,
            color: props.color,
            fontWeight: props.bold ? "bold" : "normal",
            fontStyle: props.italic ? "italic" : "normal",
            textDecoration: props.underline ? "underline" : "none",
            textAlign: props.align,
            lineHeight: 1.4,
            // FIX: блокируем выделение текста при перетаскивании
            userSelect: isSelected ? "text" : "none",
          }}
        >
          {props.content}
        </p>
      </div>
    );
  }

  if (element.type === "image") {
    const props = element.properties as IImageProperties;
    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
          // open file picker when clicking empty image
          if (!props.src) {
            createFileInputAndRead((file, src) =>
              onUpdateProp(element.id, { src, alt: file.name, file })
            );
          }
        }}
        onMouseDown={handleMouseDown}
        className="image-element"
      >
        {props.src ? (
          <img
            src={props.src}
            alt={props.alt}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            onDoubleClick={() => {
              // allow replacing image on double click
              createFileInputAndRead((file, src) =>
                onUpdateProp(element.id, { src, alt: file.name, file })
              );
            }}
          />
        ) : (
          <div className="dropzone">
            <div className="dropzone-icon">📷</div>
            <p>Нажмите для загрузки</p>
          </div>
        )}
      </div>
    );
  }

  if (element.type === "table") {
    const props = element.properties as ITableProperties;
    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={handleMouseDown}
        className="table-element"
      >
        <table
          style={{ width: "100%", height: "100%", borderCollapse: "collapse" }}
        >
          <tbody>
            {Array.from({ length: props.rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: props.cols }).map((__, j) => (
                  <td
                    key={`${i}-${j}`}
                    contentEditable
                    suppressContentEditableWarning
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()} // FIX: предотвращаем конфликт
                    onBlur={(e) => {
                      const data = [...(props.data || [])];
                      if (!data[i]) data[i] = [];
                      data[i][j] = e.currentTarget.textContent || "";
                      onUpdateProp(element.id, { data });
                    }}
                    style={{
                      border: `${props.borderWidth}px solid ${props.borderColor}`,
                      padding: "8px",
                      background: props.cellBg,
                      minWidth: "60px",
                      outline: "none",
                      cursor: "text",
                    }}
                  >
                    {props.data?.[i]?.[j] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (element.type === "date") {
    const props = element.properties as IDateProperties;
    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={handleMouseDown}
        className="date-element"
      >
        <input
          type="date"
          value={props.value}
          onChange={(e) => onUpdateProp(element.id, { value: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()} // FIX: предотвращаем конфликт
          className="date-input"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        />
      </div>
    );
  }

  if (element.type === "signature") {
    const props = element.properties as ISignatureProperties & {
      image?: string;
    };
    // allow drawing signature directly in the element
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const drawing = React.useRef(false);
    const last = React.useRef<{ x: number; y: number } | null>(null);

    const start = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!canvasRef.current) return;
      drawing.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width || 1;
      const scaleY = canvasRef.current.height / rect.height || 1;
      last.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };
    const move = (e: React.MouseEvent) => {
      if (!drawing.current || !canvasRef.current || !last.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width || 1;
      const scaleY = canvasRef.current.height / rect.height || 1;
      const nx = (e.clientX - rect.left) * scaleX;
      const ny = (e.clientY - rect.top) * scaleY;
      ctx.strokeStyle = props.color || "#000";
      ctx.lineWidth = Math.max(1, 2 * ((scaleX + scaleY) / 2));
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      last.current = { x: nx, y: ny };
    };
    const end = () => {
      if (!canvasRef.current) return;
      drawing.current = false;
      last.current = null;
      // create a copy at device resolution to preserve quality
      const orig = canvasRef.current;
      const tmp = document.createElement("canvas");
      tmp.width = orig.width;
      tmp.height = orig.height;
      const tctx = tmp.getContext("2d");
      if (tctx) tctx.drawImage(orig, 0, 0);
      const data = tmp.toDataURL("image/png");
      onUpdateProp(element.id, { image: data });
    };

    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={() => onEditSignature?.(element.id)}
        onMouseDown={handleMouseDown}
        className="signature-element"
      >
        {props.image ? (
          <img
            src={props.image}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onDoubleClick={() => onEditSignature?.(element.id)}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={Math.max(200, element.width)}
            height={Math.max(60, element.height)}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              cursor: isSelected ? "crosshair" : "pointer",
            }}
          />
        )}
      </div>
    );
  }

  if (element.type === "divider") {
    const props = element.properties as IDividerProperties;
    return (
      <div
        style={commonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={handleMouseDown}
        className="divider-element"
      >
        <div
          style={{
            borderTop: `${props.thickness}px ${props.style} ${props.color}`,
            width: "100%",
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    );
  }

  return null;
};
