import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesApi } from '../api/client';
import type { TemplateType, VisibilityType } from '../api/types';

export default function NewTemplate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType>('HTML');
  const [visibility, setVisibility] = useState<VisibilityType>('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const template = await templatesApi.create({
        title,
        description,
        template_type: templateType,
        visibility,
        html_content: templateType === 'HTML' ? getDefaultHtmlContent() : '',
      });
      navigate(`/templates/${template.id}`);
    } catch (err) {
      setError('Failed to create template');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultHtmlContent = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #2F3235; }
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    <p>Hello, {{name}}!</p>
</body>
</html>`;

  return (
    <div>
      <div className="hero-bs mb-6">
        <h1>Create New Template</h1>
        <p className="text-muted-ink mt-4">
          Choose a template type and set up basic information.
        </p>
      </div>

      <div className="surface" style={{ padding: 'var(--sp-6)', maxWidth: '600px' }}>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Template Type</label>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              <button
                type="button"
                className={`card-bs ${templateType === 'HTML' ? 'active' : ''}`}
                onClick={() => setTemplateType('HTML')}
                style={{
                  cursor: 'pointer',
                  borderColor: templateType === 'HTML' ? 'var(--c-accent)' : undefined,
                }}
              >
                <div className="card-icon mb-2">📄</div>
                <h3>HTML Template</h3>
                <p className="text-muted-ink" style={{ fontSize: 'var(--fs-5)' }}>
                  Edit in browser, export to PDF
                </p>
              </button>
              <button
                type="button"
                className={`card-bs ${templateType === 'DOCX' ? 'active' : ''}`}
                onClick={() => setTemplateType('DOCX')}
                style={{
                  cursor: 'pointer',
                  borderColor: templateType === 'DOCX' ? 'var(--c-accent)' : undefined,
                }}
              >
                <div className="card-icon mb-2">📝</div>
                <h3>DOCX Template</h3>
                <p className="text-muted-ink" style={{ fontSize: 'var(--fs-5)' }}>
                  Upload .docx with placeholders
                </p>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter template title"
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description (optional)"
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              className="select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as VisibilityType)}
            >
              <option value="PUBLIC">Public - Everyone can use this template</option>
              <option value="RESTRICTED">Restricted - Only allowed users</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
