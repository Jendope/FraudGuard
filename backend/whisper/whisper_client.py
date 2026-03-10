"""
whisper_client.py - OpenAI Whisper speech-to-text integration.

The client wraps the ``openai-whisper`` library and exposes a single method::

    transcribe(audio_bytes: bytes) -> {"text": str, "language": str, "meta": dict}

Design notes
------------
* Audio processing uses a temporary file on disk because the Whisper library
  requires a file path (or numpy array).  The temp file is always cleaned up.
* Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm (anything ffmpeg
  can decode).
* Pass ``model_name="base"`` for a fast, lightweight model suitable for demos.
  For higher accuracy use ``"small"``, ``"medium"``, or ``"large"``.
* ``device`` defaults to ``"cpu"``; change to ``"cuda"`` for GPU inference.

Note: requires ``ffmpeg`` to be installed on the host system.
"""

from __future__ import annotations

import logging
import os
import tempfile
from typing import Any

logger = logging.getLogger(__name__)

# Supported audio MIME prefixes / file extensions accepted by Whisper / ffmpeg.
SUPPORTED_EXTENSIONS = {
    "mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac",
}


class WhisperClient:
    """
    Speech-to-text client backed by OpenAI Whisper.

    Parameters
    ----------
    model_name:
        Whisper model size: ``"tiny"``, ``"base"``, ``"small"``,
        ``"medium"``, or ``"large"``.  Defaults to ``"base"``.
    device:
        Torch device string, e.g. ``"cpu"`` or ``"cuda"``.  Defaults to
        ``"cpu"`` so the demo runs on any machine without a GPU.
    language:
        Optional ISO-639-1 language code (e.g. ``"en"``, ``"zh"``) to skip
        language detection and speed up transcription.  ``None`` means
        auto-detect.

    Example
    -------
    >>> client = WhisperClient(model_name="base")
    >>> with open("audio.wav", "rb") as f:
    ...     result = client.transcribe(f.read())
    >>> print(result["text"])
    """

    def __init__(
        self,
        model_name: str = "base",
        device: str = "cpu",
        language: str | None = None,
    ):
        import whisper  # type: ignore  # lazy import for testability

        logger.info("Loading Whisper model: %s (device=%s)", model_name, device)
        self.model = whisper.load_model(model_name, device=device)
        self.model_name = model_name
        self.device = device
        self.language = language
        logger.info("Whisper model loaded: %s", model_name)

    def transcribe(self, audio_bytes: bytes, file_ext: str = "wav", language: str | None = None) -> dict:
        """
        Transcribe raw audio bytes to text.

        Parameters
        ----------
        audio_bytes:
            Raw audio content.  Any format supported by ffmpeg is accepted.
        file_ext:
            File extension hint (without leading dot) so the temp file is
            written with the correct extension.  Defaults to ``"wav"``.
        language:
            Per-call ISO-639-1 language override.  When provided this takes
            precedence over the ``language`` attribute set on the instance.
            Pass ``None`` to use the instance-level default.

        Returns
        -------
        dict with keys:

        * ``text``      (str)  — full transcription
        * ``language``  (str)  — detected or forced language code
        * ``segments``  (list) — per-segment dicts with ``start``, ``end``,
                                 and ``text`` fields
        * ``meta``      (dict) — provenance info (model name, input_bytes)
        """
        if not isinstance(audio_bytes, (bytes, bytearray)):
            raise TypeError(
                f"audio_bytes must be bytes or bytearray, got {type(audio_bytes)}"
            )
        if not audio_bytes:
            raise ValueError("audio_bytes must not be empty")

        # Sanitise extension: strip dot, lowercase, and fall back to wav.
        normalized_ext = file_ext.lstrip(".").lower()
        if normalized_ext not in SUPPORTED_EXTENSIONS:
            logger.warning(
                "Unrecognised extension '%s'; using 'wav' as fallback.", normalized_ext
            )
            normalized_ext = "wav"

        tmp_path: str | None = None
        try:
            # Write bytes to a named temp file so Whisper can read from disk.
            with tempfile.NamedTemporaryFile(
                suffix=f".{normalized_ext}", delete=False
            ) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            logger.debug(
                "Transcribing %d bytes from %s with model=%s",
                len(audio_bytes),
                tmp_path,
                self.model_name,
            )

            # Per-call language takes precedence over the instance default.
            effective_language = language if language is not None else self.language
            transcribe_kwargs: dict[str, Any] = {}
            if effective_language:
                transcribe_kwargs["language"] = effective_language

            result = self.model.transcribe(tmp_path, **transcribe_kwargs)

        except Exception as exc:
            logger.error("Whisper transcription failed: %s", exc)
            raise RuntimeError(f"Whisper transcription error: {exc}") from exc
        finally:
            # Always remove the temp file.
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    logger.warning("Could not delete temp file: %s", tmp_path)

        # Build a compact segments list (omit per-token probability arrays).
        segments = [
            {
                "start": float(seg.get("start", 0)),
                "end": float(seg.get("end", 0)),
                "text": str(seg.get("text", "")).strip(),
            }
            for seg in result.get("segments", [])
        ]

        return {
            "text": result.get("text", "").strip(),
            "language": result.get("language", self.language or ""),
            "segments": segments,
            "meta": {
                "model": self.model_name,
                "input_bytes": len(audio_bytes),
            },
        }
