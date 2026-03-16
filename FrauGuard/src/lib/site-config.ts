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

// ── 🎯 DEFAULT MODELS: QWEN STACK ─────────────────────────────────────────
// ✅ Change these ONE lines to switch entire app to GLM:
//    OCR_MODEL: 'qwen-vl-ocr-2025-11-20' → 'glm-ocr'
//    LLM_MODEL: 'qwen-3.5-plus' → 'glm-5'

export const OCR_MODEL = process.env.OCR_MODEL || 'qwen-vl-ocr'  // Qwen default
export const LLM_MODEL = process.env.LLM_MODEL || 'qwen-3.5-plus'            // Qwen default

// OCR model configurations
export const OCR_CONFIG = {
  // Qwen VL OCR (DashScope native endpoint)
  'qwen-vl-ocr-2025-11-20': {
    endpoint: '/chat/completions',
    provider: 'qwen',
    isChatFormat: true,
    description: 'Qwen VL OCR - Latest (OpenAI-compatible)',
  },
  'qwen-vl-ocr': {
    endpoint: '/chat/completions',
    provider: 'qwen',
    isChatFormat: true,
    description: 'Qwen VL OCR - Stable (OpenAI-compatible)',
  },
  // GLM-OCR (OpenAI-compatible endpoint)
  'glm-ocr': {
  endpoint: '/api/paas/v4/files/ocr',
  provider: 'glm',
  isChatFormat: false,
  description: 'GLM-OCR - File upload endpoint',
},
} as const

// Type for OCR model keys (for TypeScript safety)
export type OcrModelKey = keyof typeof OCR_CONFIG

// Helper: Get config for current OCR model
export const getCurrentOcrConfig = (model?: string) => {
  const key = (model || OCR_MODEL) as OcrModelKey
  return OCR_CONFIG[key] || OCR_CONFIG['qwen-vl-ocr-2025-11-20']
}

// Supported LLM models
export const SUPPORTED_LLM_MODELS = ['qwen-3.5-plus', 'glm-5'] as const
export type LlmModelKey = typeof SUPPORTED_LLM_MODELS[number]