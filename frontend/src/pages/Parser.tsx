import React, { useState, useEffect } from "react";
import { parserApi } from "../api/client";
import type { ParsedDocument } from "../api/types";

interface Props {
  onResultChange?: (doc: ParsedDocument | null) => void;
}

const ParserPage: React.FC<Props> = ({ onResultChange }) => {
  /* ---------- state ---------- */
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<ParsedDocument | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onResultChange?.(doc);
  }, [doc, onResultChange]);

  /* ---------- helpers ---------- */
  const humanSize = (b: number) =>
    b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)} КБ`
      : `${(b / (1024 * 1024)).toFixed(1)} МБ`;

  const reset = () => {
    setDoc(null);
    setErr(null);
    setCopied(false);
  };

  /* ---------- file handler ---------- */
  const handleFile = async (file?: File | null) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext!)) {
      setErr("Разрешены только PDF и DOCX");
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
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Не удалось распарсить документ";
      setErr(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- drag&drop ---------- */
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

  /* ---------- clipboard ---------- */
  const copyText = async () => {
    if (!doc?.extracted_text) return;
    try {
      await navigator.clipboard.writeText(doc.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Не удалось скопировать");
    }
  };

  /* ---------- download ---------- */
  const downloadTxt = () => {
    if (!doc?.extracted_text) return;
    const blob = new Blob([doc.extracted_text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${doc.original_filename.replace(/\.[^.]+$/, "")}.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- UI ---------- */
  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>📄 Извлечь текст из документа</h1>
      <p style={styles.sub}>Поддерживаются PDF и DOCX (до 20 МБ)</p>

      {err && (
        <div style={styles.error}>
          {err}
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
            accept=".pdf,.docx"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
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
                {doc.page_count && (
                  <span style={styles.badge}>{doc.page_count} стр.</span>
                )}
              </div>
            </div>
            <button style={styles.btnSec} onClick={reset}>
              Загрузить другой
            </button>
          </div>

          <label style={{ ...styles.label, marginTop: 20 }}>Результат</label>
          <div
            style={styles.textBox}
            role="textbox"
            tabIndex={0}
            aria-label="Извлечённый текст"
          >
            {doc.extracted_text || "Текст не найден"}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button style={styles.btnSec} onClick={copyText} disabled={copied}>
              {copied ? "Скопировано ✓" : "Скопировать"}
            </button>
            <button style={styles.btnPri} onClick={downloadTxt}>
              Скачать .txt
            </button>
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
  },
  closeErr: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#c00",
  },
  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    border: "2px dashed #bbb",
    borderRadius: 12,
    cursor: "pointer",
    transition: "0.2s",
  },
  dropActive: { borderColor: "#1976d2", background: "#f1f8ff" },
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
  label: { fontWeight: 600, fontSize: 14, marginBottom: 6 },
  textBox: {
    maxHeight: 320,
    overflow: "auto",
    padding: 12,
    background: "#fafafa",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    fontSize: 14,
    color: "#000",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  btnPri: {
    padding: "10px 18px",
    background: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
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
