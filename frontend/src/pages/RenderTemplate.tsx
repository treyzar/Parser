import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { templatesApi } from '../api/client';
import type { Template } from '../api/types';

export default function RenderTemplate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      const data = await templatesApi.get(Number(id));
      setTemplate(data);
      const initialValues: Record<string, string> = {};
      data.placeholders.forEach((p) => {
        initialValues[p] = '';
      });
      setValues(initialValues);
    } catch (err) {
      setError('Failed to load template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRender = async () => {
    if (!template) return;
    setRendering(true);
    setError(null);

    try {
      const blob = await templatesApi.render(template.id, { values });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.template_type === 'HTML' 
        ? `${template.title}.pdf` 
        : `${template.title}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to render document');
      console.error(err);
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
      <div className="hero-bs mb-6">
        <h1>Render: {template.title}</h1>
        <p className="text-muted-ink mt-4">{template.description || 'Fill in the fields below to generate your document.'}</p>
        <div className="flex gap-2 mt-4">
          <span className={`badge badge-${template.template_type.toLowerCase()}`}>
            {template.template_type === 'HTML' ? 'Exports to PDF' : 'Exports to DOCX'}
          </span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="surface" style={{ padding: 'var(--sp-6)', maxWidth: '600px' }}>
        {template.placeholders.length === 0 ? (
          <div className="mb-6">
            <p className="text-muted-ink">
              This template has no placeholders. Click render to generate the document as-is.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="mb-4">Fill in the fields</h3>
            {template.placeholders.map((placeholder) => (
              <div key={placeholder} className="form-group">
                <label className="label" htmlFor={placeholder}>
                  {placeholder.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>
                <input
                  type="text"
                  id={placeholder}
                  className="input"
                  value={values[placeholder] || ''}
                  onChange={(e) => handleValueChange(placeholder, e.target.value)}
                  placeholder={`Enter ${placeholder}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back
          </button>
          <button onClick={() => navigate(`/templates/${template.id}`)} className="btn btn-ghost">
            Edit Template
          </button>
          <button onClick={handleRender} className="btn btn-primary" disabled={rendering}>
            {rendering ? 'Generating...' : `Download ${template.template_type === 'HTML' ? 'PDF' : 'DOCX'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
