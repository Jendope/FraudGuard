/**
 * LandingPage.jsx — Main interface landing page for HK FraudGuard.
 *
 * Displays a hero section with project description and a prominent
 * "Try Demo" button that launches the demo environment.
 *
 * Props:
 *   onTryDemo {Function} - called when user clicks the Try Demo button
 */

import React from 'react';
import { useLanguage } from '../i18n';
import LanguageToggle from './LanguageToggle';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #0d2b5c 50%, #0a3d8f 100%)',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },
  langToggleWrap: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
  },
  badge: {
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: '0.35rem 1rem',
    fontSize: '0.85rem',
    letterSpacing: '0.05em',
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: 'clamp(2rem, 6vw, 3.5rem)',
    fontWeight: 800,
    margin: '0 0 1rem',
    textAlign: 'center',
    lineHeight: 1.15,
  },
  highlight: {
    color: '#60a5fa',
  },
  tagline: {
    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
    color: 'rgba(255,255,255,0.75)',
    margin: '0 0 2.5rem',
    textAlign: 'center',
    maxWidth: 540,
    lineHeight: 1.6,
  },
  tryDemoBtn: {
    padding: '1rem 2.5rem',
    fontSize: '1.15rem',
    fontWeight: 700,
    borderRadius: 50,
    border: 'none',
    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(59,130,246,0.5)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    marginBottom: '1rem',
    letterSpacing: '0.02em',
  },
  modeHints: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modePill: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 20,
    padding: '0.4rem 1rem',
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.85)',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '3rem',
    maxWidth: 720,
    width: '100%',
  },
  featureCard: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '1.25rem',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },
  featureTitle: {
    fontWeight: 600,
    fontSize: '0.95rem',
    margin: '0 0 0.35rem',
  },
  featureDesc: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.65)',
    margin: 0,
    lineHeight: 1.5,
  },
  footer: {
    marginTop: '3rem',
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
};

export default function LandingPage({ onTryDemo }) {
  const { t } = useLanguage();

  const FEATURES = [
    {
      icon: '🔍',
      title: t('landing_feature_ocr_title'),
      desc: t('landing_feature_ocr_desc'),
    },
    {
      icon: '🤖',
      title: t('landing_feature_llm_title'),
      desc: t('landing_feature_llm_desc'),
    },
    {
      icon: '📚',
      title: t('landing_feature_rag_title'),
      desc: t('landing_feature_rag_desc'),
    },
  ];

  function handleMouseEnter(e) {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,130,246,0.65)';
  }
  function handleMouseLeave(e) {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.5)';
  }

  return (
    <main style={styles.page} aria-label="HK FraudGuard landing page">
      <div style={styles.langToggleWrap}>
        <LanguageToggle />
      </div>

      <div style={styles.badge}>{t('landing_badge')}</div>

      <h1 style={styles.heading}>
        {t('landing_heading_prefix')}
        <span style={styles.highlight}>{t('landing_heading_highlight')}</span>
      </h1>

      <p style={styles.tagline}>{t('landing_tagline')}</p>

      <button
        style={styles.tryDemoBtn}
        onClick={onTryDemo}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {t('landing_try_demo')}
      </button>

      <div style={styles.modeHints} aria-label="Available analysis modes">
        <span style={styles.modePill}>{t('landing_mode_llm')}</span>
        <span style={styles.modePill}>{t('landing_mode_rag')}</span>
      </div>

      <div style={styles.featuresGrid} role="list" aria-label="Key features">
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} style={styles.featureCard} role="listitem">
            <div style={styles.featureIcon} aria-hidden="true">{icon}</div>
            <p style={styles.featureTitle}>{title}</p>
            <p style={styles.featureDesc}>{desc}</p>
          </div>
        ))}
      </div>

      <footer style={styles.footer}>
        <p>{t('landing_footer')}</p>
      </footer>
    </main>
  );
}
