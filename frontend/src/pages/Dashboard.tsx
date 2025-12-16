import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { templatesApi } from '../api/client';
import type { TemplateListItem } from '../api/types';

type Scope = 'public' | 'my' | 'shared';

export default function Dashboard() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [scope, setScope] = useState<Scope>('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [scope]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await templatesApi.list(scope);
      setTemplates(data);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hero-bs mb-6">
        <h1>Template Dashboard</h1>
        <p className="text-muted-ink mt-4">
          Manage your document templates, create new ones, or generate documents from existing templates.
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${scope === 'public' ? 'active' : ''}`}
          onClick={() => setScope('public')}
        >
          Public
        </button>
        <button
          className={`tab ${scope === 'my' ? 'active' : ''}`}
          onClick={() => setScope('my')}
        >
          My Templates
        </button>
        <button
          className={`tab ${scope === 'shared' ? 'active' : ''}`}
          onClick={() => setScope('shared')}
        >
          Shared with Me
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="card-bs" style={{ textAlign: 'center' }}>
          <p className="text-muted-ink">No templates found in this category.</p>
          <Link to="/templates/new" className="btn btn-primary mt-4">
            Create New Template
          </Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {templates.map((template) => (
            <div key={template.id} className="card-bs">
              <div className="card-header-bs">
                <div className="card-icon">
                  {template.template_type === 'HTML' ? '📄' : '📝'}
                </div>
                <div>
                  <h3>{template.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`badge badge-${template.template_type.toLowerCase()}`}>
                      {template.template_type}
                    </span>
                    <span className={`badge badge-${template.visibility.toLowerCase()}`}>
                      {template.visibility}
                    </span>
                  </div>
                </div>
              </div>
              {template.description && (
                <p className="text-muted-ink mb-4">{template.description}</p>
              )}
              {template.placeholders.length > 0 && (
                <p className="text-muted-ink mb-4" style={{ fontSize: 'var(--fs-5)' }}>
                  Fields: {template.placeholders.join(', ')}
                </p>
              )}
              <div className="flex gap-2">
                <Link to={`/templates/${template.id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <Link to={`/render/${template.id}`} className="btn btn-primary">
                  Render
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
