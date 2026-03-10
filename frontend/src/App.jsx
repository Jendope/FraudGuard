/**
 * App.jsx — Root application component for the HK FraudGuard unified UI.
 *
 * View flow:
 *   1. 'landing'  — LandingPage    (main interface with "Try Demo" button)
 *   2. 'tutorial' — OnboardingTutorial (accessibility-focused, elderly-friendly)
 *   3. 'demo'     — OCR → LLM pipeline (ToggleMode + UploadForm + results)
 *
 * The tutorial is shown every time the user enters the demo from the landing
 * page and can be skipped at any point.
 */

import React, { useState, useCallback } from 'react';
import { useLanguage } from './i18n';
import LandingPage from './components/LandingPage';
import OnboardingTutorial from './components/OnboardingTutorial';
import ToggleMode from './components/ToggleMode';
import UploadForm from './components/UploadForm';
import AudioUpload from './components/AudioUpload';
import LanguageToggle from './components/LanguageToggle';
import { processImage, transcribeAudio } from './api';

const containerStyle = {
  maxWidth: 760,
  margin: '2rem auto',
  padding: '0 1rem',
  fontFamily: 'system-ui, sans-serif',
};

const cardStyle = {
  background: '#f9f9f9',
  border: '1px solid #ddd',
  borderRadius: 8,
  padding: '1rem',
  marginTop: '1.5rem',
};

const preStyle = {
  whiteSpace: 'pre-wrap',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 4,
  padding: '0.75rem',
  fontSize: '0.9rem',
};

const backLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  background: 'none',
  border: 'none',
  color: '#0070f3',
  cursor: 'pointer',
  fontSize: '0.95rem',
  padding: 0,
  marginBottom: '1rem',
  textDecoration: 'underline',
};

const tabStyle = (active) => ({
  padding: '0.4rem 1rem',
  fontWeight: active ? 'bold' : 'normal',
  cursor: 'pointer',
  border: 'none',
  borderBottom: active ? '2px solid #0070f3' : '2px solid transparent',
  background: 'none',
  fontSize: '1rem',
  color: active ? '#0070f3' : '#444',
});

const demoHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const demoLangToggleStyle = {
  display: 'inline-flex',
  gap: 0,
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #ccc',
};

export default function App() {
  const { t, lang, switchLang } = useLanguage();

  // 'landing' | 'tutorial' | 'demo'
  const [view, setView] = useState('landing');
  // 'image' | 'audio'
  const [demoTab, setDemoTab] = useState('image');

  // Demo state
  const [mode, setMode] = useState('raw');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState('');

  // Audio/transcription state
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [transcriptionError, setTranscriptionError] = useState('');

  function handleTryDemo() {
    setView('tutorial');
  }

  function handleTutorialComplete() {
    setView('demo');
  }

  function handleBackToLanding() {
    setView('landing');
    setResult(null);
    setApiError('');
    setTranscriptionResult(null);
    setTranscriptionError('');
  }

  const handleSubmit = useCallback(async ({ file, prompt }) => {
    setApiError('');
    setResult(null);
    setIsLoading(true);
    try {
      const data = await processImage({ file, mode, prompt });
      setResult(data);
    } catch (err) {
      setApiError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  async function handleAudioSubmit({ file, language, analyze }) {
    setTranscriptionError('');
    setTranscriptionResult(null);
    setIsLoading(true);
    try {
      const data = await transcribeAudio({ file, language, analyze });
      setTranscriptionResult(data);
    } catch (err) {
      setTranscriptionError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  if (view === 'landing') {
    return <LandingPage onTryDemo={handleTryDemo} />;
  }

  const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'zh-hant', label: '繁體' },
    { code: 'zh-hans', label: '简体' },
  ];

  return (
    <>
      {/* Onboarding tutorial overlays the demo view */}
      {view === 'tutorial' && (
        <OnboardingTutorial onComplete={handleTutorialComplete} />
      )}

      <div style={containerStyle}>
        <div style={demoHeaderStyle}>
          <button
            style={backLinkStyle}
            onClick={handleBackToLanding}
            aria-label="Back to home page"
          >
            {t('demo_back_home')}
          </button>

          <div style={demoLangToggleStyle} role="radiogroup" aria-label="Language selector">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={lang === code}
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: lang === code ? 700 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  background: lang === code ? '#0070f3' : 'transparent',
                  color: lang === code ? '#fff' : '#444',
                }}
                onClick={() => switchLang(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <h1 style={{ marginBottom: '0.25rem' }}>{t('demo_heading')}</h1>
        <p style={{ color: '#555', marginTop: 0 }}>
          {t('demo_description')}
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '1.5rem' }}>
          <button style={tabStyle(demoTab === 'image')} onClick={() => setDemoTab('image')}>
            {t('demo_tab_image')}
          </button>
          <button style={tabStyle(demoTab === 'audio')} onClick={() => setDemoTab('audio')}>
            {t('demo_tab_audio')}
          </button>
        </div>

        {/* Image / OCR tab */}
        {demoTab === 'image' && (
          <>
            <ToggleMode value={mode} onChange={setMode} />

            <div style={{ marginTop: '1.5rem' }}>
              <UploadForm mode={mode} onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {apiError && (
              <div role="alert" style={{ ...cardStyle, borderColor: '#f00', color: '#c00' }}>
                <strong>{t('demo_error')}</strong> {apiError}
              </div>
            )}

            {result && (
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>
                  {t('demo_results')}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#888' }}>
                    {t('demo_mode_label')} {result.mode}
                  </span>
                </h2>

                <section>
                  <h3>{t('demo_ocr_text')}</h3>
                  <pre style={preStyle}>{result.ocr_text || t('demo_empty')}</pre>
                </section>

                {result.retrieved && result.retrieved.length > 0 && (
                  <section>
                    <h3>{t('demo_retrieved')}</h3>
                    <ol style={{ paddingLeft: '1.25rem' }}>
                      {result.retrieved.map((passage, i) => (
                        <li key={i} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                          {passage}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                <section>
                  <h3>{t('demo_llm_output')}</h3>
                  <pre style={preStyle}>{result.llm_output || t('demo_empty')}</pre>
                </section>

                {result.provenance && (
                  <details style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                    <summary>{t('demo_provenance')}</summary>
                    <pre>{JSON.stringify(result.provenance, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}
          </>
        )}

        {/* Audio / Whisper STT tab */}
        {demoTab === 'audio' && (
          <>
            <p style={{ color: '#555', margin: '0 0 1rem' }}>
              {t('demo_audio_desc')}
            </p>

            <AudioUpload onSubmit={handleAudioSubmit} isLoading={isLoading} />

            {transcriptionError && (
              <div role="alert" style={{ ...cardStyle, borderColor: '#f00', color: '#c00' }}>
                <strong>{t('demo_error')}</strong> {transcriptionError}
              </div>
            )}

            {transcriptionResult && (
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>
                  {t('demo_transcription')}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#888' }}>
                    {t('demo_language_label')} {transcriptionResult.language || t('audio_unknown')}
                  </span>
                </h2>

                <section>
                  <h3>{t('demo_transcribed_text')}</h3>
                  <pre style={preStyle}>{transcriptionResult.text || t('demo_empty')}</pre>
                </section>

                {transcriptionResult.segments && transcriptionResult.segments.length > 0 && (
                  <section>
                    <h3>{t('demo_segments')}</h3>
                    <ol style={{ paddingLeft: '1.25rem' }}>
                      {transcriptionResult.segments.map((seg, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                          <span style={{ color: '#888' }}>
                            [{(seg.start ?? 0).toFixed(1)}s – {(seg.end ?? 0).toFixed(1)}s]
                          </span>{' '}
                          {seg.text}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {transcriptionResult.fraud && (
                  <section>
                    <h3>{t('demo_fraud_analysis')}</h3>
                    {transcriptionResult.fraud.error ? (
                      <p style={{ color: '#c00' }}>{transcriptionResult.fraud.error}</p>
                    ) : (
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          padding: '0.75rem',
                        }}
                      >
                        <p style={{ margin: '0 0 0.5rem' }}>
                          <strong>{t('demo_fraud_probability')}</strong>{' '}
                          {(transcriptionResult.fraud.probability * 100).toFixed(0)}%
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>{t('demo_fraud_reason')}</strong> {transcriptionResult.fraud.reason}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {transcriptionResult.meta && (
                  <details style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                    <summary>{t('demo_meta')}</summary>
                    <pre>{JSON.stringify(transcriptionResult.meta, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
