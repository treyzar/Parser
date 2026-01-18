// src/components/ParserPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parserApi } from "../api/client";
import type { ParsedDocument } from "../api/types";

interface Props {
  onResultChange?: (doc: ParsedDocument | null) => void;
}

const ParserPage: React.FC<Props> = ({ onResultChange }) => {
  const navigate = useNavigate();

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    onResultChange?.(doc);
  }, [doc, onResultChange]);

  const humanSize = (b: number) =>
    b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)} КБ`
      : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

  const reset = () => {
    setDoc(null);
    setErr(null);
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "html"].includes(ext!)) {
      setErr("Разрешены только PDF, DOCX и HTML");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErr("Максимальный размер 20 МБ");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const res = await parserApi.parse(file);
      setDoc(res);
      const elements = (res as any).editor_elements;

      setTimeout(() => {
        navigate("/templates/new", {
          state: {
            importedElements: elements,
            prefillText: res.extracted_text,
            title: res.original_filename,
          },
        });
      }, 500);
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Не удалось распарсить документ";
      setErr(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>📄 Извлечь текст из документа</h1>
      <p style={styles.sub}>Поддерживаются PDF, DOCX и HTML (до 20 МБ)</p>

      {err && (
        <div style={styles.error}>
          <span>{err}</span>
          <button
            style={styles.closeErr}
            onClick={() => setErr(null)}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      )}

      {!doc ? (
        <label
          style={{ ...styles.dropZone, ...(dragOver ? styles.dropActive : {}) }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          htmlFor="file-input"
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.html"
            style={{ display: "none" }}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {loading ? (
            <>
              <div style={styles.spinner} />
              <span>Обрабатываем документ…</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 48 }}>📎</span>
              <span style={{ fontWeight: 600, marginTop: 8 }}>
                Перетащите файл сюда
              </span>
              <span style={{ opacity: 0.7, fontSize: 14 }}>
                или нажмите для выбора
              </span>
            </>
          )}
        </label>
      ) : (
        <section style={styles.card}>
          <div style={styles.head}>
            <div>
              <h3 style={{ margin: 0, color: "black" }}>
                {doc.original_filename}
              </h3>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span style={styles.badge}>{doc.file_type.toUpperCase()}</span>
                <span style={styles.badge}>{humanSize(doc.file_size)}</span>
              </div>
            </div>
            <button style={styles.btnSec} onClick={reset}>
              Загрузить другой
            </button>
          </div>
          <div style={{ marginTop: 20, textAlign: "center", padding: 20 }}>
            <div style={styles.spinner} />
            <p>Переход в редактор...</p>
          </div>
        </section>
      )}
    </div>
  );
};

/* ---------- стили ---------- */
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    maxWidth: 680,
    margin: "40px auto",
    padding: "0 16px",
    fontFamily: "system-ui, sans-serif",
  },
  title: { fontSize: 28, marginBottom: 8 },
  sub: { opacity: 0.7, marginBottom: 24 },
  error: {
    background: "#fee",
    border: "1px solid #fcc",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#c00",
  },
  closeErr: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#c00",
    marginLeft: 10,
  },
  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    // Используем shorthand border
    border: "2px dashed #bbb",
    borderRadius: 12,
    cursor: "pointer",
    transition: "0.2s",
  },
  dropActive: {
    // ИСПРАВЛЕНИЕ: Используем полный border вместо borderColor, чтобы избежать конфликта
    border: "2px dashed #1976d2",
    background: "#f1f8ff",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #ddd",
    borderTopColor: "#1976d2",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: "24px 28px",
    color: "black",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    color: "black",
  },
  badge: {
    background: "#f2f2f2",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 13,
  },
  btnSec: {
    padding: "10px 18px",
    background: "#e5e5e5",
    color: "#000",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};

export default ParserPage;
