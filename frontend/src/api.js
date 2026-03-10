/**
 * api.js — thin HTTP client for the OCR → LLM pipeline backend.
 *
 * Usage:
 *   import { processImage, transcribeAudio } from './api';
 *   const result = await processImage({ file, mode, prompt });
 *   const result = await transcribeAudio({ file, language, analyze });
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';

/** Default request timeout in milliseconds (2 minutes for large OCR/LLM calls). */
const REQUEST_TIMEOUT_MS = 120_000;

/**
 * POST /process with multipart/form-data.
 *
 * @param {Object} params
 * @param {File}   params.file    - image file from an <input type="file">
 * @param {string} params.mode    - "raw" | "rag"
 * @param {string} [params.prompt] - optional user instruction
 * @returns {Promise<{mode, ocr_text, retrieved, llm_output, provenance}>}
 */
export async function processImage({ file, mode, prompt = '' }) {
  if (!file) throw new Error('file is required');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);
  if (prompt.trim()) {
    formData.append('prompt', prompt.trim());
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? `Server error ${response.status}`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * POST /transcribe with multipart/form-data.
 *
 * Sends an audio file to the Whisper speech-to-text endpoint and returns
 * the transcription along with an optional fraud-detection result.
 *
 * @param {Object}  params
 * @param {File}    params.file       - audio file (wav, mp3, m4a, webm, etc.)
 * @param {string}  [params.language] - ISO-639-1 language hint, e.g. "en"
 * @param {boolean} [params.analyze]  - when true, also run fraud detection on
 *                                      the transcribed text
 * @returns {Promise<{text, language, segments, meta, fraud}>}
 */
export async function transcribeAudio({ file, language = '', analyze = false }) {
  if (!file) throw new Error('file is required');

  const formData = new FormData();
  formData.append('file', file);
  if (language.trim()) {
    formData.append('language', language.trim());
  }
  if (analyze) {
    formData.append('analyze', 'true');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/transcribe`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? `Server error ${response.status}`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
