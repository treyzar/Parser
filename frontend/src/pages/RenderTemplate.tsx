// src/pages/RenderTemplate.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { templatesApi } from "../api/client";
import type { Template } from "../api/types";

export default function RenderTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTemplate();
    } else {
      setError("Template ID is missing");
      setLoading(false);
    }
  }, [id]);

  const loadTemplate = async () => {
    if (!id) return;
    
    try {
      const data = await templatesApi.get(Number(id));
      setTemplate(data);
      const initialValues: Record<string, string> = {};
      data.placeholders.forEach((p) => {
        initialValues[p] = "";
      });
      setValues(initialValues);
    } catch (err) {
      setError("Failed to load template");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  /* Скачивание исходного файла в разных форматах */
  const handleDownload = async (format: "pdf" | "html" | "docx" | "json") => {
    if (!template) return;
    setDownloading(format);
    setError(null);

    try {
      const blob = await templatesApi.downloadSource(template.id, format);

      // Проверяем, не вернулась ли ошибка в виде JSON
      if (blob.type === "application/json") {
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || "Download failed");
        } catch (parseErr) {
          throw new Error("Download failed");
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed";
      setError(message);

      // Специальное сообщение для DOCX
      if (format === "docx" && message.includes("not available")) {
        setError(
          "DOCX файл недоступен. Этот шаблон создан в веб-редакторе. Скачайте PDF или HTML.",
        );
      }
    } finally {
      setDownloading(null);
    }
  };

  /* Рендер с заполнением полей */
  const handleRenderData = async () => {
    if (!template) return;
    setRendering(true);
    setError(null);

    try {
      const blob = await templatesApi.render(template.id, { values });

      // Проверяем на ошибку
      if (blob.type === "application/json") {
        const text = await blob.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || "Render failed");
        } catch (parseErr) {
          throw new Error("Render failed");
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Определяем расширение по типу
      const extension =
        template.template_type === "DOCX" && template.docx_file
          ? "docx"
          : "pdf";
      a.download = `${template.title}_filled.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ошибка генерации документа";
      setError(message);
    } finally {
      setRendering(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!template) {
    return <div className="error-message">Template not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="hero-bs mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/dashboard" className="text-muted-ink hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
        <h1>📄 {template.title}</h1>
        <p className="text-muted-ink mt-2">
          {template.description ||
            "Скачайте шаблон или заполните поля для генерации документа"}
        </p>
        <div className="flex gap-2 mt-4">
          <span
            className={`badge badge-${template.template_type.toLowerCase()}`}
          >
            {template.template_type}
          </span>
          <span className="badge">{template.visibility}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="error-message mb-4"
          style={{
            padding: "12px 16px",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            color: "#c00",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          maxWidth: "1000px",
        }}
      >
        {/* Левая колонка: Скачивание */}
        <div className="surface" style={{ padding: "var(--sp-6)" }}>
          <h3 className="mb-4">📥 Скачать шаблон</h3>
          <p className="text-muted-ink mb-4" style={{ fontSize: "14px" }}>
            Скачайте пустой шаблон без заполнения полей
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* PDF - всегда доступен */}
            <button
              className="btn btn-secondary"
              onClick={() => handleDownload("pdf")}
              disabled={!!downloading}
              style={{ justifyContent: "flex-start", gap: "8px" }}
            >
              {downloading === "pdf" ? (
                <span
                  className="spinner"
                  style={{ width: 16, height: 16 }}
                ></span>
              ) : (
                "📕"
              )}
              Скачать PDF
            </button>

            {/* HTML - всегда доступен */}
            <button
              className="btn btn-secondary"
              onClick={() => handleDownload("html")}
              disabled={!!downloading}
              style={{ justifyContent: "flex-start", gap: "8px" }}
            >
              {downloading === "html" ? (
                <span
                  className="spinner"
                  style={{ width: 16, height: 16 }}
                ></span>
              ) : (
                "🌐"
              )}
              Скачать HTML
            </button>

            {/* JSON - всегда доступен */}
            <button
              className="btn btn-secondary"
              onClick={() => handleDownload("json")}
              disabled={!!downloading}
              style={{ justifyContent: "flex-start", gap: "8px" }}
            >
              {downloading === "json" ? (
                <span
                  className="spinner"
                  style={{ width: 16, height: 16 }}
                ></span>
              ) : (
                "⚙️"
              )}
              Скачать JSON
            </button>

            {/* DOCX - только если есть файл */}
            {template.docx_file && (
              <button
                className="btn btn-secondary"
                onClick={() => handleDownload("docx")}
                disabled={!!downloading}
                style={{ justifyContent: "flex-start", gap: "8px" }}
              >
                {downloading === "docx" ? (
                  <span
                    className="spinner"
                    style={{ width: 16, height: 16 }}
                  ></span>
                ) : (
                  "📘"
                )}
                Скачать DOCX
              </button>
            )}
          </div>

          {!template.docx_file && template.template_type === "DOCX" && (
            <p className="text-muted-ink mt-4" style={{ fontSize: "12px" }}>
              ℹ️ DOCX недоступен (шаблон создан в веб-редакторе)
            </p>
          )}
        </div>

        {/* Правая колонка: Заполнение и рендер */}
        <div className="surface" style={{ padding: "var(--sp-6)" }}>
          <h3 className="mb-4">✏️ Заполнить и скачать</h3>

          {template.placeholders.length > 0 ? (
            <>
              <p className="text-muted-ink mb-4" style={{ fontSize: "14px" }}>
                Заполните поля и скачайте готовый документ
              </p>

              {template.placeholders.map((placeholder) => (
                <div key={placeholder} className="form-group">
                  <label className="label" htmlFor={placeholder}>
                    {placeholder.replace(/_/g, " ").toUpperCase()}
                  </label>
                  <input
                    type="text"
                    id={placeholder}
                    className="input"
                    value={values[placeholder] || ""}
                    onChange={(e) =>
                      handleValueChange(placeholder, e.target.value)
                    }
                    placeholder={`Введите ${placeholder}`}
                  />
                </div>
              ))}

              <button
                onClick={handleRenderData}
                className="btn btn-primary"
                disabled={rendering}
                style={{ width: "100%", marginTop: "16px" }}
              >
                {rendering ? (
                  <>
                    <span
                      className="spinner"
                      style={{ width: 16, height: 16 }}
                    ></span>
                    Генерация...
                  </>
                ) : (
                  <>✅ Сгенерировать {template.docx_file ? "DOCX" : "PDF"}</>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-muted-ink mb-4">
                В этом шаблоне нет полей для заполнения (плейсхолдеров типа{" "}
                {"{{name}}"}).
              </p>
              <button
                onClick={handleRenderData}
                className="btn btn-primary"
                disabled={rendering}
                style={{ width: "100%" }}
              >
                {rendering ? "Генерация..." : "Скачать документ"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview секция (опционально) */}
      {template.html_content && (
        <div className="surface mt-6" style={{ padding: "var(--sp-6)" }}>
          <h3 className="mb-4">👁️ Предпросмотр HTML</h3>
          <div
            style={{
              border: "1px solid #eee",
              borderRadius: "8px",
              padding: "20px",
              background: "#fff",
              maxHeight: "400px",
              overflow: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: template.html_content }}
          />
        </div>
      )}
    </div>
  );
}
