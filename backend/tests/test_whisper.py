"""
test_whisper.py - Unit tests for the Whisper speech-to-text client and the
/transcribe Flask endpoint.

The ``whisper`` library and its model weights are mocked so tests run without
any GPU or network access.
"""

import importlib
import sys
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers to build a WhisperClient with an injected mock model
# ---------------------------------------------------------------------------

def _make_whisper_client(transcribe_return: dict | None = None):
    """
    Build a WhisperClient instance whose internal Whisper model is mocked.

    Parameters
    ----------
    transcribe_return:
        Dict that the mock ``model.transcribe()`` should return.  Defaults
        to a minimal valid Whisper output.
    """
    from whisper.whisper_client import WhisperClient  # noqa: F401

    if transcribe_return is None:
        transcribe_return = {
            "text": " Hello world",
            "language": "en",
            "segments": [
                {"id": 0, "start": 0.0, "end": 1.5, "text": " Hello world"}
            ],
        }

    client = WhisperClient.__new__(WhisperClient)
    client.model_name = "base"
    client.device = "cpu"
    client.language = None

    mock_model = MagicMock()
    mock_model.transcribe.return_value = transcribe_return
    client.model = mock_model
    return client


# ---------------------------------------------------------------------------
# WhisperClient unit tests
# ---------------------------------------------------------------------------

class TestWhisperClient:
    def test_transcribe_returns_required_keys(self):
        client = _make_whisper_client()
        result = client.transcribe(b"fake_audio")
        assert "text" in result
        assert "language" in result
        assert "segments" in result
        assert "meta" in result

    def test_transcribe_strips_leading_whitespace_from_text(self):
        client = _make_whisper_client({"text": "  Hello world  ", "language": "en", "segments": []})
        result = client.transcribe(b"fake_audio")
        assert result["text"] == "Hello world"

    def test_transcribe_returns_language(self):
        client = _make_whisper_client({"text": "你好", "language": "zh", "segments": []})
        result = client.transcribe(b"fake_audio")
        assert result["language"] == "zh"

    def test_transcribe_raises_on_non_bytes(self):
        client = _make_whisper_client()
        with pytest.raises(TypeError):
            client.transcribe("not bytes")  # type: ignore

    def test_transcribe_raises_on_empty_bytes(self):
        client = _make_whisper_client()
        with pytest.raises(ValueError):
            client.transcribe(b"")

    def test_transcribe_meta_contains_model_name(self):
        client = _make_whisper_client()
        result = client.transcribe(b"audio")
        assert result["meta"]["model"] == "base"

    def test_transcribe_meta_contains_input_bytes(self):
        data = b"x" * 100
        client = _make_whisper_client()
        result = client.transcribe(data)
        assert result["meta"]["input_bytes"] == 100

    def test_transcribe_segments_normalised(self):
        client = _make_whisper_client({
            "text": "Test",
            "language": "en",
            "segments": [
                {"start": 0.0, "end": 2.0, "text": " Test", "tokens": [1, 2]},
            ],
        })
        result = client.transcribe(b"audio")
        seg = result["segments"][0]
        # tokens array should NOT be forwarded (internal Whisper detail)
        assert "tokens" not in seg
        assert seg["text"] == "Test"
        assert seg["start"] == 0.0
        assert seg["end"] == 2.0

    def test_unknown_extension_falls_back_to_wav(self, tmp_path, caplog):
        import logging
        client = _make_whisper_client()
        with caplog.at_level(logging.WARNING):
            result = client.transcribe(b"audio", file_ext="xyz")
        assert result["text"] is not None

    def test_language_override_is_respected(self):
        client = _make_whisper_client({"text": "Bonjour", "language": "fr", "segments": []})
        client.language = "fr"
        result = client.transcribe(b"audio")
        # Model should have been called with language="fr"
        call_kwargs = client.model.transcribe.call_args[1]
        assert call_kwargs.get("language") == "fr"

    def test_no_language_kwarg_when_language_is_none(self):
        client = _make_whisper_client({"text": "Hello", "language": "en", "segments": []})
        client.language = None
        client.transcribe(b"audio")
        call_kwargs = client.model.transcribe.call_args[1]
        assert "language" not in call_kwargs


# ---------------------------------------------------------------------------
# /transcribe Flask endpoint tests
# ---------------------------------------------------------------------------

def _build_app_with_whisper():
    """
    Import (or reload) backend.app with all heavy models mocked, then inject
    a mock WhisperClient so /transcribe can be tested without weights.
    """
    mock_st_instance = MagicMock()
    mock_st_instance.encode.return_value = [[0.1] * 8]
    mock_st_cls = MagicMock(return_value=mock_st_instance)

    mock_chroma_instance = MagicMock()
    mock_chroma_instance._collection.count.return_value = 0
    mock_chroma_instance.as_retriever.return_value = MagicMock()
    mock_chroma_cls = MagicMock(return_value=mock_chroma_instance)

    mock_lc_vs_module = MagicMock()
    mock_lc_vs_module.Chroma = mock_chroma_cls

    mock_lc_community = MagicMock()
    mock_lc_community.vectorstores = mock_lc_vs_module

    mock_chat_openai_instance = MagicMock()
    mock_chat_openai_instance.invoke.return_value = MagicMock(
        content='{"score":3,"reason":"test"}'
    )
    mock_chat_openai_cls = MagicMock(return_value=mock_chat_openai_instance)

    mock_lc_openai = MagicMock()
    mock_lc_openai.ChatOpenAI = mock_chat_openai_cls

    mock_prompt_cls = MagicMock()
    mock_prompt_cls.from_template.return_value = MagicMock()
    mock_lc_core_prompts = MagicMock()
    mock_lc_core_prompts.ChatPromptTemplate = mock_prompt_cls
    mock_lc_core = MagicMock()
    mock_lc_core.prompts = mock_lc_core_prompts

    with (
        patch("sentence_transformers.SentenceTransformer", mock_st_cls),
        patch.dict("sys.modules", {
            "langchain_openai": mock_lc_openai,
            "langchain_community": mock_lc_community,
            "langchain_community.vectorstores": mock_lc_vs_module,
            "langchain_core": mock_lc_core,
            "langchain_core.prompts": mock_lc_core_prompts,
            "dotenv": MagicMock(),
        }),
    ):
        for mod_name in list(sys.modules.keys()):
            if mod_name in ("backend.app", "app"):
                del sys.modules[mod_name]
        import backend.app as app_module  # type: ignore

    # Reset lazy singletons
    app_module._ocr_client = None
    app_module._llm_client = None
    app_module._rag_client = None
    app_module._whisper_client = None

    # Inject mock whisper client
    mock_whisper = MagicMock()
    mock_whisper.language = None
    mock_whisper.transcribe.return_value = {
        "text": "This is a test transcription.",
        "language": "en",
        "segments": [{"start": 0.0, "end": 2.0, "text": "This is a test transcription."}],
        "meta": {"model": "base", "input_bytes": 42},
    }
    app_module._whisper_client = mock_whisper

    flask_app = app_module.app
    flask_app.config["TESTING"] = True
    return flask_app, mock_whisper, app_module


@pytest.fixture()
def whisper_app():
    return _build_app_with_whisper()


@pytest.fixture()
def whisper_client(whisper_app):
    flask_app, *_ = whisper_app
    return flask_app.test_client()


def _audio_upload(content=b"fake_audio", filename="test.wav", extra=None):
    data = {"file": (BytesIO(content), filename)}
    if extra:
        data.update(extra)
    return data


class TestTranscribeEndpoint:
    def test_missing_file_returns_400(self, whisper_client):
        rv = whisper_client.post("/transcribe", data={}, content_type="multipart/form-data")
        assert rv.status_code == 400
        assert b"file" in rv.data.lower()

    def test_empty_file_returns_400(self, whisper_client):
        data = {"file": (BytesIO(b""), "empty.wav")}
        rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        assert rv.status_code == 400

    def test_successful_transcription_returns_expected_fields(self, whisper_client):
        data = _audio_upload()
        rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        assert rv.status_code == 200
        body = rv.get_json()
        assert "text" in body
        assert "language" in body
        assert "segments" in body
        assert "meta" in body

    def test_transcription_text_returned(self, whisper_client):
        data = _audio_upload()
        rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        body = rv.get_json()
        assert body["text"] == "This is a test transcription."

    def test_fraud_field_null_by_default(self, whisper_client):
        data = _audio_upload()
        rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        body = rv.get_json()
        assert body["fraud"] is None

    def test_fraud_analysis_included_when_analyze_true(self, whisper_client, whisper_app):
        _, _, app_module = whisper_app
        # Mock predict_fraud_probability
        original = app_module.predict_fraud_probability
        app_module.predict_fraud_probability = MagicMock(return_value=(0.3, "Low risk"))
        try:
            data = _audio_upload(extra={"analyze": "true"})
            rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
            body = rv.get_json()
            assert body["fraud"] is not None
            assert "probability" in body["fraud"]
            assert "reason" in body["fraud"]
        finally:
            app_module.predict_fraud_probability = original

    def test_language_override_accepted(self, whisper_client):
        data = _audio_upload(extra={"language": "zh"})
        rv = whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        assert rv.status_code == 200

    def test_whisper_called_with_audio_bytes(self, whisper_client, whisper_app):
        _, mock_whisper, _ = whisper_app
        data = _audio_upload(content=b"audio_content")
        whisper_client.post("/transcribe", data=data, content_type="multipart/form-data")
        mock_whisper.transcribe.assert_called_once()
        call_args = mock_whisper.transcribe.call_args[0]
        assert call_args[0] == b"audio_content"

    def test_non_audio_mime_returns_400(self, whisper_client):
        data = {"file": (BytesIO(b"data"), "image.png")}
        # Manually override content_type of the uploaded file by faking the
        # multipart boundaries.  Instead, just verify the endpoint handles the
        # validation: a PNG with no matching extension gets rejected.
        # We post with an explicit image content-type in the part.
        from io import BytesIO as BIO
        rv = whisper_client.post(
            "/transcribe",
            data={"file": (BIO(b"data"), "image.png", "image/png")},
            content_type="multipart/form-data",
        )
        assert rv.status_code == 400
        body = rv.get_json()
        assert "error" in body
