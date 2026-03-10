/**
 * ToggleMode.jsx — Radio-button toggle between "Raw LLM" and "LLM+RAG" modes.
 *
 * Props:
 *   value    {string}   - current mode: "raw" | "rag"
 *   onChange {Function} - callback(newMode: string)
 */

import React from 'react';
import { useLanguage } from '../i18n';

export default function ToggleMode({ value, onChange }) {
  const { t } = useLanguage();

  const MODES = [
    { value: 'raw', label: t('toggle_raw') },
    { value: 'rag', label: t('toggle_rag') },
  ];

  return (
    <fieldset style={{ border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: 6 }}>
      <legend style={{ fontWeight: 'bold', padding: '0 0.25rem' }}>{t('toggle_legend')}</legend>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {MODES.map(({ value: modeVal, label }) => (
          <label key={modeVal} style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              name="mode"
              value={modeVal}
              checked={value === modeVal}
              onChange={() => onChange(modeVal)}
              style={{ marginRight: '0.4rem' }}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
