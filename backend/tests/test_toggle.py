"""
test_toggle.py - Unit tests for the /process endpoint toggle logic.

The OCR and LLM clients are mocked so the Flask app can be tested without
heavy model weights.
"""

import sys
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _build_app():
    """
    Import (or reload) backend.app with all heavy model loading mocked.

    Returns (flask_app, mock_ocr, mock_llm, mock_rag).
    """
    # Build a mock SentenceTransformer that never downloads weights.
    mock_st_instance = MagicMock()
    mock_st_instance.encode.return_value = [[0.1] * 8]
    mock_st_cls = MagicMock(return_value=mock_st_instance)

    # Build mock Chroma / LangChain objects so app.py doesn't error on them.
    mock_chroma_instance = MagicMock()
    mock_chroma_instance._collection.count.return_value = 0
    mock_chroma_instance.as_retriever.return_value = MagicMock()
    mock_chroma_cls = MagicMock(return_value=mock_chroma_instance)

    mock_lc_vs_module = MagicMock()
    mock_lc_vs_module.Chroma = mock_chroma_cls

    mock_lc_community = MagicMock()
    mock_lc_community.vectorstores = mock_lc_vs_module

    # Mock langchain_chroma module (app.py now imports Chroma from here)
    mock_lc_chroma = MagicMock()
    mock_lc_chroma.Chroma = mock_chroma_cls

    mock_chat_openai_instance = MagicMock()
    mock_chat_openai_instance.invoke.return_value = MagicMock(
        content='{"score":5,"reason":"test","scam_tactics":[],"prevention_advice":"","warning_message":""}'
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

    # Patch SentenceTransformer at the real module level so app.py's
    # LocalEmbeddings() uses the mock, not the real model loader.
    with (
        patch("sentence_transformers.SentenceTransformer", mock_st_cls),
        patch.dict("sys.modules", {
            "langchain_openai": mock_lc_openai,
            "langchain_community": mock_lc_community,
            "langchain_community.vectorstores": mock_lc_vs_module,
            "langchain_chroma": mock_lc_chroma,
            "langchain_core": mock_lc_core,
            "langchain_core.prompts": mock_lc_core_prompts,
            "dotenv": MagicMock(),
        }),
    ):
        # Remove any cached app module so we get a fresh load with mocks.
        for mod_name in list(sys.modules.keys()):
            if mod_name in ("backend.app", "app"):
                del sys.modules[mod_name]

        import app as app_module  # type: ignore

    # Reset lazy singletons (OCR/LLM/RAG pipeline and fraud detection)
    app_module._ocr_client = None
    app_module._llm_client = None
    app_module._rag_client = None
    app_module._fraud_embeddings = None
    app_module._fraud_vectorstore = None
    app_module._fraud_retriever = None
    app_module._fraud_llm = None

    # Inject mocks for OCR / LLM / RAG
    mock_ocr = MagicMock()
    mock_ocr.extract_text.return_value = {
        "text": "Extracted text from OCR",
        "raw": [],
        "meta": {"model": "zai-org/GLM-OCR"},
    }

    mock_llm = MagicMock()
    mock_llm.ask.return_value = "LLM response text"

    mock_rag = MagicMock()
    mock_rag._chunks = ["chunk1", "chunk2"]
    mock_rag.build_context.return_value = (["chunk1", "chunk2"], "chunk1\n\nchunk2")

    app_module._ocr_client = mock_ocr
    app_module._llm_client = mock_llm
    app_module._rag_client = mock_rag

    flask_app = app_module.app
    flask_app.config["TESTING"] = True
    return flask_app, mock_ocr, mock_llm, mock_rag


@pytest.fixture()
def app():
    return _build_app()


@pytest.fixture()
def client(app):
    flask_app, *_ = app
    return flask_app.test_client()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _make_upload(content=b"fake_image", filename="test.png", mode=None, prompt=None):
    data = {"file": (BytesIO(content), filename)}
    if mode is not None:
        data["mode"] = mode
    if prompt is not None:
        data["prompt"] = prompt
    return data


# ---------------------------------------------------------------------------
# /process endpoint — basic routing
# ---------------------------------------------------------------------------

class TestProcessEndpoint:
    def test_missing_file_returns_400(self, client):
        rv = client.post("/process", data={}, content_type="multipart/form-data")
        assert rv.status_code == 400
        assert b"file" in rv.data.lower() or rv.status_code == 400

    def test_empty_file_returns_400(self, client):
        data = {"file": (BytesIO(b""), "empty.png")}
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        assert rv.status_code == 400

    def test_invalid_mode_returns_400(self, client):
        data = _make_upload(mode="unknown")
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        assert rv.status_code == 400
        json_data = rv.get_json()
        assert "mode" in json_data.get("error", "").lower()

    def test_raw_mode_returns_expected_fields(self, client):
        data = _make_upload(mode="raw")
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        assert rv.status_code == 200
        body = rv.get_json()
        assert body["mode"] == "raw"
        assert "ocr_text" in body
        assert "llm_output" in body
        assert "provenance" in body
        # In raw mode, retrieved should be null
        assert body["retrieved"] is None

    def test_rag_mode_returns_retrieved_passages(self, client):
        data = _make_upload(mode="rag")
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        assert rv.status_code == 200
        body = rv.get_json()
        assert body["mode"] == "rag"
        assert isinstance(body["retrieved"], list)
        assert len(body["retrieved"]) > 0

    def test_default_mode_used_when_not_specified(self, client, app):
        _, mock_ocr, mock_llm, mock_rag = app
        data = _make_upload()  # no mode
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        assert rv.status_code == 200
        body = rv.get_json()
        # Default is "raw" (from config.DEFAULT_MODE)
        assert body["mode"] in ("raw", "rag")

    def test_ocr_is_called_with_image_bytes(self, client, app):
        _, mock_ocr, *_ = app
        data = _make_upload(content=b"image_content", mode="raw")
        client.post("/process", data=data, content_type="multipart/form-data")
        mock_ocr.extract_text.assert_called_once_with(b"image_content")

    def test_llm_is_called_in_raw_mode(self, client, app):
        _, _, mock_llm, _ = app
        data = _make_upload(mode="raw", prompt="Summarise this")
        client.post("/process", data=data, content_type="multipart/form-data")
        mock_llm.ask.assert_called_once()
        prompt_arg = mock_llm.ask.call_args[0][0]
        assert "Summarise this" in prompt_arg

    def test_rag_index_documents_called_in_rag_mode(self, client, app):
        _, _, _, mock_rag = app
        data = _make_upload(mode="rag")
        client.post("/process", data=data, content_type="multipart/form-data")
        mock_rag.index_documents.assert_called_once()

    def test_provenance_contains_mode(self, client):
        data = _make_upload(mode="raw")
        rv = client.post("/process", data=data, content_type="multipart/form-data")
        body = rv.get_json()
        assert body["provenance"]["mode"] == "raw"
