import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { docBuilderApi } from '../api/client';
import type { DocumentProjectListItem, EditorContent as EditorContentType } from '../api/types';
import './DocumentBuilder.css';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DocumentBuilder() {
  const [projects, setProjects] = useState<DocumentProjectListItem[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [title, setTitle] = useState('Untitled Document');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: '<p>Start typing your document here...</p>',
  });

  const loadProjects = useCallback(async () => {
    try {
      const data = await docBuilderApi.list();
      setProjects(data);
    } catch {
      console.error('Failed to load projects');
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const handleNew = () => {
    setCurrentProjectId(null);
    setTitle('Untitled Document');
    editor?.commands.setContent('<p>Start typing your document here...</p>');
    showMessage('New document created', 'success');
  };

  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const content_json = editor.getJSON() as EditorContentType;
      const content_text = editor.getText();

      if (currentProjectId) {
        await docBuilderApi.update(currentProjectId, { title, content_json, content_text });
        showMessage('Document saved', 'success');
      } else {
        const project = await docBuilderApi.create({ title, content_json, content_text });
        setCurrentProjectId(project.id);
        showMessage('Document created', 'success');
      }
      await loadProjects();
    } catch {
      showMessage('Failed to save document', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = async (id: number) => {
    setLoading(true);
    try {
      const project = await docBuilderApi.get(id);
      setCurrentProjectId(project.id);
      setTitle(project.title);
      if (project.content_json && Object.keys(project.content_json).length > 0) {
        editor?.commands.setContent(project.content_json);
      } else {
        editor?.commands.setContent('<p></p>');
      }
      showMessage('Document loaded', 'success');
    } catch {
      showMessage('Failed to load document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await docBuilderApi.delete(id);
      if (currentProjectId === id) {
        handleNew();
      }
      await loadProjects();
      showMessage('Document deleted', 'success');
    } catch {
      showMessage('Failed to delete document', 'error');
    }
  };

  const handleExportJson = async () => {
    if (!currentProjectId) {
      showMessage('Save document first', 'error');
      return;
    }

    try {
      const blob = await docBuilderApi.exportJson(currentProjectId);
      downloadBlob(blob, `${title}.docflow.json`);
      showMessage('Project exported', 'success');
    } catch {
      showMessage('Failed to export project', 'error');
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const project = await docBuilderApi.importJson(file);
      setCurrentProjectId(project.id);
      setTitle(project.title);
      if (project.content_json && Object.keys(project.content_json).length > 0) {
        editor?.commands.setContent(project.content_json);
      }
      await loadProjects();
      showMessage('Project imported', 'success');
    } catch {
      showMessage('Failed to import project', 'error');
    } finally {
      setLoading(false);
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleExportDocx = async () => {
    if (!currentProjectId) {
      showMessage('Save document first', 'error');
      return;
    }

    try {
      const blob = await docBuilderApi.exportDocx(currentProjectId);
      downloadBlob(blob, `${title}.docx`);
      showMessage('DOCX exported', 'success');
    } catch {
      showMessage('Failed to export DOCX', 'error');
    }
  };

  const handleExportPdf = async () => {
    if (!currentProjectId) {
      showMessage('Save document first', 'error');
      return;
    }

    try {
      const blob = await docBuilderApi.exportPdf(currentProjectId);
      downloadBlob(blob, `${title}.pdf`);
      showMessage('PDF exported', 'success');
    } catch {
      showMessage('Failed to export PDF', 'error');
    }
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const project = await docBuilderApi.importDocx(file);
      setCurrentProjectId(project.id);
      setTitle(project.title);
      if (project.content_json && Object.keys(project.content_json).length > 0) {
        editor?.commands.setContent(project.content_json);
      }
      await loadProjects();
      showMessage('DOCX imported', 'success');
    } catch {
      showMessage('Failed to import DOCX', 'error');
    } finally {
      setLoading(false);
      if (docxInputRef.current) docxInputRef.current.value = '';
    }
  };

  const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const project = await docBuilderApi.importPdf(file);
      setCurrentProjectId(project.id);
      setTitle(project.title);
      if (project.content_json && Object.keys(project.content_json).length > 0) {
        editor?.commands.setContent(project.content_json);
      }
      await loadProjects();
      showMessage('PDF imported', 'success');
    } catch {
      showMessage('Failed to import PDF', 'error');
    } finally {
      setLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="hero-bs mb-6">
        <h1>Document Builder</h1>
        <p className="text-muted-ink mt-4">
          Create and edit documents visually. Export to DOCX or PDF, or import existing files.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="builder-layout surface">
        <aside className="builder-sidebar">
          <div className="sidebar-header">
            <h3>My Drafts</h3>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={handleNew}>
                New
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="project-list">
            {projects.length === 0 ? (
              <p className="text-muted-ink text-center py-4">No documents yet</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-item ${currentProjectId === project.id ? 'active' : ''}`}
                >
                  <div
                    className="project-item-content"
                    onClick={() => handleLoadProject(project.id)}
                  >
                    <span className="project-title">{project.title}</span>
                    <span className="project-date">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="builder-main">
          <div className="editor-header">
            <input
              type="text"
              className="input title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          {editor && (
            <div className="toolbar">
              <button
                className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold"
              >
                B
              </button>
              <button
                className={`toolbar-btn italic ${editor.isActive('italic') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic"
              >
                I
              </button>
              <button
                className={`toolbar-btn underline ${editor.isActive('underline') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline"
              >
                U
              </button>
              <div className="toolbar-divider" />
              <button
                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
              >
                H1
              </button>
              <button
                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
              >
                H2
              </button>
              <button
                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
              >
                H3
              </button>
              <div className="toolbar-divider" />
              <button
                className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                •
              </button>
              <button
                className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                1.
              </button>
            </div>
          )}

          <div className="editor-area">
            {loading ? (
              <div className="loading">
                <div className="spinner" />
              </div>
            ) : (
              <EditorContent editor={editor} className="tiptap-editor" />
            )}
          </div>
        </main>

        <aside className="builder-actions">
          <h3>Actions</h3>

          <div className="action-group">
            <h4>Project</h4>
            <button className="btn btn-secondary btn-block" onClick={handleExportJson}>
              Export .docflow.json
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => jsonInputRef.current?.click()}
            >
              Import .docflow.json
            </button>
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,.docflow.json"
              onChange={handleImportJson}
              style={{ display: 'none' }}
            />
          </div>

          <div className="action-group">
            <h4>Import</h4>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => docxInputRef.current?.click()}
            >
              Import DOCX
            </button>
            <input
              ref={docxInputRef}
              type="file"
              accept=".docx"
              onChange={handleImportDocx}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-secondary btn-block"
              onClick={() => pdfInputRef.current?.click()}
            >
              Import PDF
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handleImportPdf}
              style={{ display: 'none' }}
            />
          </div>

          <div className="action-group">
            <h4>Export</h4>
            <button className="btn btn-primary btn-block" onClick={handleExportDocx}>
              Export DOCX
            </button>
            <button className="btn btn-primary btn-block" onClick={handleExportPdf}>
              Export PDF
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
