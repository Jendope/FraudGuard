/**
 * site-config.ts — centralised site configuration.
 *
 * Update GITHUB_REPO_URL here (or via the NEXT_PUBLIC_GITHUB_REPO_URL env
 * variable) whenever the repository URL changes.  All references in the
 * application read from this file so there is only one place to edit.
 *
 * Set NEXT_PUBLIC_API_BASE to point the demo section at your Flask backend.
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
