/**
 * site-config.ts — centralised site configuration.
 *
 * Update GITHUB_REPO_URL here (or via the NEXT_PUBLIC_GITHUB_REPO_URL env
 * variable) whenever the repository URL changes.  All references in the
 * application read from this file so there is only one place to edit.
 *
 * Set NEXT_PUBLIC_API_BASE to point the demo section at your Flask backend.
 * Set OCR_MODEL to choose between Qwen VL OCR or GLM-OCR.
 */

// ── GitHub repository URL ─────────────────────────────────────────────────
// Change this value (or set NEXT_PUBLIC_GITHUB_REPO_URL) when the repo moves.
export const GITHUB_REPO_URL =
  process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/Jendope/FraudGuard'

export const GITHUB_README_URL = `${GITHUB_REPO_URL}/blob/main/README.md`

// ── Backend API base URL ──────────────────────────────────────────────────
// Override via NEXT_PUBLIC_API_BASE to point at a deployed backend.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

// ── OCR Model Configuration ───────────────────────────────────────────────
// ✅ Change this ONE line to switch OCR providers:
//    'qwen-vl-ocr-2025-11-20' → Alibaba Qwen VL OCR (latest)
//    'glm-ocr'                → Zhipu GLM-OCR (layout parsing)
//
// Override via OCR_MODEL env var (set in .env.local or Vercel Dashboard).
export const OCR_MODEL =
  process.env.OCR_MODEL || 'qwen-vl-ocr-2025-11-20'

// OCR model endpoint + provider mappings (don't need to change these)
export const OCR_CONFIG = {
  // Qwen VL OCR models (Alibaba DashScope)
  'qwen-vl-ocr-2025-11-20': {
    endpoint: '/ocr',
    provider: 'qwen',
    description: 'Qwen VL OCR - Latest version with improved accuracy',
  },
  'qwen-vl-ocr': {
    endpoint: '/ocr',
    provider: 'qwen',
    description: 'Qwen VL OCR - Stable version',
  },
  // GLM-OCR models (Zhipu BigModel)
  'glm-ocr': {
    endpoint: '/layout_parsing',
    provider: 'glm',
    description: 'GLM-OCR - Layout-aware text extraction',
  },
  'glm-4v': {
    endpoint: '/chat/completions',
    provider: 'glm',
    description: 'GLM-4V - Vision + chat combined',
  },
} as const

// Type for OCR model keys (for TypeScript safety)
export type OcrModelKey = keyof typeof OCR_CONFIG

// Helper: Get config for current OCR model
export const getCurrentOcrConfig = () => {
  const config = OCR_CONFIG[OCR_MODEL as OcrModelKey]
  if (!config) {
    console.warn(`⚠️ Unknown OCR model: ${OCR_MODEL}. Using first available.`)
    return OCR_CONFIG[Object.keys(OCR_CONFIG)[0] as OcrModelKey]
  }
  return config
}