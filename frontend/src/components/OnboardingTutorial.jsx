/**
 * OnboardingTutorial.jsx — Accessibility-focused step-by-step onboarding
 * tutorial designed for elderly users.
 *
 * Design principles applied:
 *   - Large text (minimum 18px body, 24px+ headings) for easy reading
 *   - High-contrast colours (#1a1a1a on #fff; white on #1d4ed8)
 *   - Large tap/click targets (min 48px height)
 *   - Simple vocabulary, plain-language instructions
 *   - Clear progress indicator
 *   - "Skip Tutorial" option always visible
 *
 * Props:
 *   onComplete {Function} - called when user finishes or skips the tutorial
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n';

function TutorialSteps({ t }) {
  return [
    {
      id: 1,
      emoji: '👋',
      title: t('tutorial_step1_title'),
      body: (
        <>
          <p>
            {t('tutorial_step1_p1')}
          </p>
          <p>
            {t('tutorial_step1_p2')}
          </p>
        </>
      ),
    },
    {
      id: 2,
      emoji: '📷',
      title: t('tutorial_step2_title'),
      body: (
        <>
          <p>
            {t('tutorial_step2_p1')}
          </p>
          <p>
            {t('tutorial_step2_p2')}
          </p>
          <p style={{ background: '#fef9c3', borderRadius: 8, padding: '0.75rem 1rem', color: '#713f12' }}>
            💡 <strong>{t('tutorial_step2_tip')}</strong>
          </p>
        </>
      ),
    },
    {
      id: 3,
      emoji: '⬆️',
      title: t('tutorial_step3_title'),
      body: (
        <>
          <p>
            {t('tutorial_step3_p1')}
          </p>
          <p>
            {t('tutorial_step3_p2')}
          </p>
        </>
      ),
    },
    {
      id: 4,
      emoji: '🔎',
      title: t('tutorial_step4_title'),
      body: (
        <>
          <p>
            {t('tutorial_step4_intro')}
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: 2 }}>
            <li>
              <strong>{t('tutorial_step4_llm')}</strong>
            </li>
            <li>
              <strong>{t('tutorial_step4_rag')}</strong>
            </li>
          </ul>
          <p>
            {t('tutorial_step4_recommend')}
          </p>
        </>
      ),
    },
    {
      id: 5,
      emoji: '✅',
      title: t('tutorial_step5_title'),
      body: (
        <>
          <p>
            {t('tutorial_step5_intro')}
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: 2 }}>
            <li>{t('tutorial_step5_item1')}</li>
            <li>
              {t('tutorial_step5_item2')}
            </li>
            <li>
              {t('tutorial_step5_item3')}
            </li>
          </ul>
          <p>
            {t('tutorial_step5_warning')}
          </p>
        </>
      ),
    },
    {
      id: 6,
      emoji: '🎉',
      title: t('tutorial_step6_title'),
      body: (
        <>
          <p>
            {t('tutorial_step6_p1')}
          </p>
          <p>
            {t('tutorial_step6_p2')}
          </p>
          <p style={{ background: '#dcfce7', borderRadius: 8, padding: '0.75rem 1rem', color: '#14532d' }}>
            🛡️ <strong>{t('tutorial_step6_safety')}</strong>
          </p>
        </>
      ),
    },
  ];
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
    boxSizing: 'border-box',
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    maxWidth: 600,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2rem',
    boxSizing: 'border-box',
    position: 'relative',
    color: '#1a1a1a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  skipBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'transparent',
    border: '1px solid #9ca3af',
    borderRadius: 6,
    padding: '0.4rem 0.85rem',
    fontSize: '0.9rem',
    color: '#6b7280',
    cursor: 'pointer',
    minHeight: 36,
  },
  progressBar: {
    display: 'flex',
    gap: '0.35rem',
    marginBottom: '1.75rem',
  },
  progressDot: (active, done) => ({
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: done ? '#1d4ed8' : active ? '#93c5fd' : '#e5e7eb',
    transition: 'background 0.3s ease',
  }),
  emojiDisplay: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
    lineHeight: 1,
    display: 'block',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 1.9rem)',
    fontWeight: 700,
    margin: '0 0 1.25rem',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  stepBody: {
    fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
    lineHeight: 1.75,
    color: '#374151',
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2rem',
    gap: '0.75rem',
  },
  backBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: 8,
    border: '2px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    cursor: 'pointer',
    minHeight: 48,
    flex: 1,
  },
  nextBtn: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    borderRadius: 8,
    border: 'none',
    background: '#1d4ed8',
    color: '#fff',
    cursor: 'pointer',
    minHeight: 48,
    flex: 2,
  },
  pageCounter: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: '1rem',
  },
};

export default function OnboardingTutorial({ onComplete }) {
  const { t } = useLanguage();
  const STEPS = TutorialSteps({ t });
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function goNext() {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Onboarding tutorial">
      <div style={styles.modal}>
        {/* Skip button */}
        <button
          style={styles.skipBtn}
          onClick={onComplete}
        >
          {t('tutorial_skip')}
        </button>

        {/* Progress bar */}
        <div style={styles.progressBar} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={styles.progressDot(i === step, i < step)} />
          ))}
        </div>

        {/* Emoji icon */}
        <span style={styles.emojiDisplay} aria-hidden="true">{current.emoji}</span>

        {/* Step title */}
        <h2 style={styles.stepTitle}>{current.title}</h2>

        {/* Step body */}
        <div style={styles.stepBody}>{current.body}</div>

        {/* Navigation */}
        <div style={styles.navRow}>
          {step > 0 ? (
            <button style={styles.backBtn} onClick={goBack} aria-label="Go to previous step">
              {t('tutorial_back')}
            </button>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <button style={styles.nextBtn} onClick={goNext} aria-label={isLast ? 'Start the demo' : 'Go to next step'}>
            {isLast ? t('tutorial_start_demo') : t('tutorial_next')}
          </button>
        </div>

        {/* Page counter */}
        <p style={styles.pageCounter}>
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
