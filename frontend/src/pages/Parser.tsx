import { useState, useCallback } from 'react';
import { parserApi } from '../api/client';
import type { ParsedDocument } from '../api/types';

export default function Parser() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParsedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf' && ext !== 'docx') {
      setError('Only PDF and DOCX files are allowed');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds 20MB limit');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = await parserApi.parse(file);
      setResult(parsed);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Failed to parse document');
      } else {
        setError('Failed to parse document');
      }
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadAsTxt = () => {
    if (!result) return;
    const blob = new Blob([result.extracted_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.original_filename.replace(/\.[^.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetParser = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div>
      <div className="hero-bs mb-6">
        <h1>Document Parser</h1>
        <p className="text-muted-ink mt-4">
          Upload a PDF or DOCX file to extract its text content.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!result ? (
        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            type="file"
            id="file-input"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <>
              <div className="spinner mb-4"></div>
              <p>Parsing document...</p>
            </>
          ) : (
            <>
              <div className="dropzone-icon">📄</div>
              <h3>Drop your file here</h3>
              <p className="text-muted-ink mt-2">or click to browse</p>
              <p className="text-muted-ink mt-4" style={{ fontSize: 'var(--fs-5)' }}>
                Supported formats: PDF, DOCX (max 20MB)
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="surface" style={{ padding: 'var(--sp-6)' }}>
          <div className="flex flex-between mb-6">
            <div>
              <h3>{result.original_filename}</h3>
              <div className="flex gap-3 mt-2">
                <span className="badge">{result.file_type}</span>
                <span className="badge">{formatFileSize(result.file_size)}</span>
                {result.page_count && <span className="badge">{result.page_count} pages</span>}
              </div>
            </div>
            <button onClick={resetParser} className="btn btn-secondary">
              Parse Another
            </button>
          </div>

          <div className="form-group">
            <label className="label">Extracted Text</label>
            <div className="result-box">{result.extracted_text || 'No text content found.'}</div>
          </div>

          <div className="flex gap-3">
            <button onClick={copyToClipboard} className="btn btn-secondary">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={downloadAsTxt} className="btn btn-primary">
              Download as .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
