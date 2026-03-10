/**
 * AudioUpload.jsx — Audio file upload and optional live recording for the
 * Whisper speech-to-text feature.
 *
 * Props:
 *   onSubmit   {Function} - callback({ file, language, analyze })
 *   isLoading  {boolean}
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n';

const ACCEPTED_AUDIO = '.mp3,.mp4,.m4a,.wav,.webm,.ogg,.flac';

export default function AudioUpload({ onSubmit, isLoading }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('');
  const [analyze, setAnalyze] = useState(false);
  const [error, setError] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [canRecord, setCanRecord] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Check if the browser supports MediaRecorder.
  useEffect(() => {
    setCanRecord(
      typeof window !== 'undefined' &&
        typeof window.MediaRecorder !== 'undefined' &&
        typeof navigator.mediaDevices?.getUserMedia === 'function'
    );
  }, []);

  function handleFileChange(e) {
    setError('');
    const selected = e.target.files?.[0] ?? null;
    if (selected && !selected.type.startsWith('audio/') && !selected.type.startsWith('video/')) {
      setError(t('audio_error_type'));
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const recorded = new File([blob], 'recording.webm', { type: 'audio/webm' });
        setFile(recorded);
        clearInterval(timerRef.current);
        setRecordingSeconds(0);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(
        () => setRecordingSeconds((s) => s + 1),
        1000
      );
    } catch (err) {
      setError(`${t('audio_mic_denied')} ${err.message}`);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError(t('audio_error_required'));
      return;
    }
    onSubmit({ file, language, analyze });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* File picker */}
      <div>
        <label
          htmlFor="audio-file-input"
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}
        >
          {t('audio_file_label')}
        </label>
        <input
          id="audio-file-input"
          type="file"
          accept={ACCEPTED_AUDIO}
          onChange={handleFileChange}
          disabled={isLoading || isRecording}
        />
        {file && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
            {t('audio_selected')} {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>

      {/* Live recording (only when supported) */}
      {canRecord && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isLoading}
              style={recordBtnStyle(false)}
            >
              {t('audio_start_recording')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={stopRecording}
                style={recordBtnStyle(true)}
              >
                {t('audio_stop_recording')}
              </button>
              <span style={{ fontSize: '0.85rem', color: '#c00' }}>
                {recordingSeconds}s
              </span>
            </>
          )}
        </div>
      )}

      {/* Optional language hint */}
      <div>
        <label
          htmlFor="language-input"
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}
        >
          {t('audio_language_label')}{' '}
          <span style={{ fontWeight: 'normal', color: '#666', fontSize: '0.85rem' }}>
            {t('audio_language_optional')}
          </span>
        </label>
        <input
          id="language-input"
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder={t('audio_language_placeholder')}
          maxLength={10}
          disabled={isLoading}
          style={{
            padding: '0.4rem',
            borderRadius: 4,
            border: '1px solid #ccc',
            width: 160,
          }}
        />
      </div>

      {/* Fraud analysis toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={analyze}
          onChange={(e) => setAnalyze(e.target.checked)}
          disabled={isLoading}
        />
        {t('audio_analyze_label')}
      </label>

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
          background: '#7c3aed',
          color: '#fff',
          border: 'none',
        }}
      >
        {isLoading ? t('audio_transcribing') : t('audio_transcribe')}
      </button>
    </form>
  );
}

function recordBtnStyle(active) {
  return {
    padding: '0.4rem 1rem',
    borderRadius: 6,
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    background: active ? '#c00' : '#22c55e',
    color: '#fff',
    fontSize: '0.9rem',
  };
}
