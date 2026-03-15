# ASR Removal

> **Date:** March 2026

## What was removed

The ASR (Automatic Speech Recognition) component was removed from the project as part of the FrauGuard refactoring. The following components were deleted:

- `backend/whisper/` — QwenASRClient and legacy WhisperClient
- `/transcribe` API endpoint in `backend/app.py`
- `sampleRagPipelineWeb/src/app/api/transcribe/route.ts` — Next.js API route
- Voice Analysis tab in the demo page
- `ASR_MODEL` and `ASR_LANGUAGE` configuration variables
- `test_whisper.py` — ASR-specific tests
- `ffmpeg` dependency in the backend Dockerfile

## Why

ASR was removed to simplify the project scope and reduce deployment complexity:

1. **Scope reduction** — The core value of the project is fraud detection using text analysis (RAG + LLM) and OCR, not speech transcription.
2. **Dependency simplification** — Removing ASR eliminated the need for `ffmpeg` in the Docker image, reducing image size and build time.
3. **Cleaner architecture** — The backend now has a single focused purpose: text and image fraud analysis.

## Impact

- The `/transcribe` API endpoint is no longer available
- Audio file uploads are no longer supported in the demo UI
- The `ASR_MODEL` and `ASR_LANGUAGE` environment variables are no longer used
- The `openai` Python package is still used by the LLM client but is no longer needed for ASR

If ASR is needed in the future, it can be re-added as a separate microservice.
