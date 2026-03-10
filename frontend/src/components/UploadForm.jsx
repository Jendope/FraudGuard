/**
 * UploadForm.jsx — File upload, optional prompt, and submit button.
 *
 * Props:
 *   mode       {string}   - current mode ("raw" | "rag")
 *   onSubmit   {Function} - callback({ file, prompt })
 *   isLoading  {boolean}
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n';

/** Maximum allowed upload size: 50 MB */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export default function UploadForm({ mode, onSubmit, isLoading }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');

  function handleFileChange(e) {
    setError('');
    const selected = e.target.files?.[0] ?? null;
    if (selected && !selected.type.startsWith('image/')) {
      setError(t('upload_error_type'));
      setFile(null);
      return;
    }
    if (selected && selected.size > MAX_FILE_SIZE_BYTES) {
      setError(t('upload_error_size').replace('{size}', String(MAX_FILE_SIZE_BYTES / (1024 * 1024))));
      setFile(null);
      return;
    }
    setFile(selected);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError(t('upload_error_required'));
      return;
    }
    onSubmit({ file, prompt });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="file-input" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
          {t('upload_image_label')}
        </label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {file && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
            {t('upload_selected')} {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="prompt-input" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>
          {t('upload_prompt_label')}
        </label>
        <textarea
          id="prompt-input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('upload_prompt_placeholder')}
          disabled={isLoading}
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.4rem', borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>

      {error && (
        <p role="alert" style={{ color: '#c00', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !file}
        style={{
          padding: '0.6rem 1.5rem',
          fontWeight: 'bold',
          fontSize: '1rem',
          cursor: isLoading || !file ? 'not-allowed' : 'pointer',
          borderRadius: 6,
          background: '#0070f3',
          color: '#fff',
          border: 'none',
        }}
      >
        {isLoading ? t('upload_processing') : (mode === 'rag' ? t('upload_process_rag') : t('upload_process_raw'))}
      </button>
    </form>
  );
}
