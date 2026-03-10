/**
 * LanguageToggle.jsx — Compact language switcher for the three supported
 * languages: English, Traditional Chinese, and Simplified Chinese.
 *
 * Designed to be placed in headers or navigation bars with a small footprint.
 */

import React from 'react';
import { useLanguage } from '../i18n';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'zh-hant', label: '繁體' },
  { code: 'zh-hans', label: '简体' },
];

const wrapperStyle = {
  display: 'inline-flex',
  gap: 0,
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.3)',
};

function btnStyle(active) {
  return {
    padding: '0.35rem 0.7rem',
    fontSize: '0.8rem',
    fontWeight: active ? 700 : 400,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'rgba(255,255,255,0.25)' : 'transparent',
    color: '#fff',
    transition: 'background 0.2s',
  };
}

export default function LanguageToggle() {
  const { lang, switchLang } = useLanguage();

  return (
    <div style={wrapperStyle} role="radiogroup" aria-label="Language selector">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={lang === code}
          style={btnStyle(lang === code)}
          onClick={() => switchLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
