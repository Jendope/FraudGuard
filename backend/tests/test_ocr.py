"""
test_ocr.py - Unit tests for the GLM-OCR REST API client.

The ``requests.post`` call is mocked so tests run without network access or
a real BigModel API key.
"""

import base64
import os
from unittest.mock import MagicMock, patch

import pytest

# Provide a dummy API key so GLMOCR.__init__ does not raise.
os.environ.setdefault("BIGMODEL_API_KEY", "test_bigmodel_key")

from modules.ocr_client import BIGMODEL_OCR_URL, GLMOCR

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_response(body: dict, status_code: int = 200) -> MagicMock:
    """Build a mock requests.Response that returns *body* as JSON."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = body
    mock_resp.raise_for_status = MagicMock()  # no-op for 200
    return mock_resp


def _make_ocr_client(post_return: dict | None = None) -> tuple[GLMOCR, MagicMock]:
    """
    Return a ``(GLMOCR, mock_post)`` pair where ``requests.post`` is patched
    to return *post_return* (default: ``{"choices": [{"message": {"content": "Sample OCR output"}}]}``).
    """
    if post_return is None:
        post_return = {"choices": [{"message": {"content": "Sample OCR output"}}]}

    mock_resp = _make_mock_response(post_return)
    mock_post = MagicMock(return_value=mock_resp)
    return mock_post


# ---------------------------------------------------------------------------
# GLMOCR._parse_response
# ---------------------------------------------------------------------------

class TestParseResponse:
    def setup_method(self):
        self.client = GLMOCR.__new__(GLMOCR)
        self.client.model_name = "glm-ocr"
        self.client.api_key = "test_key"
        self.client.url = BIGMODEL_OCR_URL

    def test_choices_response(self):
        data = {"choices": [{"message": {"content": "Hello world"}}]}
        assert self.client._parse_response(data) == "Hello world"

    def test_content_field(self):
        data = {"content": "direct content"}
        assert self.client._parse_response(data) == "direct content"

    def test_result_field(self):
        data = {"result": "result text"}
        assert self.client._parse_response(data) == "result text"

    def test_text_field(self):
        data = {"text": "plain text"}
        assert self.client._parse_response(data) == "plain text"

    def test_non_dict_coerced_to_str(self):
        assert isinstance(self.client._parse_response("raw string"), str)
        assert isinstance(self.client._parse_response(42), str)

    def test_empty_dict_returns_str(self):
        result = self.client._parse_response({})
        assert isinstance(result, str)


# ---------------------------------------------------------------------------
# GLMOCR.extract_text
# ---------------------------------------------------------------------------

class TestGLMOCR:
    def test_extract_text_returns_dict_with_required_keys(self):
        mock_post = _make_ocr_client()
        with patch("modules.ocr_client.requests.post", mock_post):
            client = GLMOCR(api_key="test_key")
            result = client.extract_text(b"\x89PNG\r\n")
        assert "text" in result
        assert "raw" in result
        assert "meta" in result

    def test_extract_text_normalises_choices_response(self):
        mock_post = _make_ocr_client(
            {"choices": [{"message": {"content": "Invoice #123"}}]}
        )
        with patch("modules.ocr_client.requests.post", mock_post):
            client = GLMOCR(api_key="test_key")
            result = client.extract_text(b"fake_image_bytes")
        assert result["text"] == "Invoice #123"

    def test_extract_text_raises_on_non_bytes(self):
        client = GLMOCR.__new__(GLMOCR)
        client.model_name = "glm-ocr"
        client.api_key = "test_key"
        client.url = BIGMODEL_OCR_URL
        with pytest.raises(TypeError):
            client.extract_text("not bytes")  # type: ignore

    def test_meta_contains_model_name(self):
        mock_post = _make_ocr_client()
        with patch("modules.ocr_client.requests.post", mock_post):
            client = GLMOCR(api_key="test_key")
            result = client.extract_text(b"img")
        assert result["meta"]["model"] == "glm-ocr"

    def test_meta_contains_input_bytes(self):
        data = b"x" * 42
        mock_post = _make_ocr_client()
        with patch("modules.ocr_client.requests.post", mock_post):
            client = GLMOCR(api_key="test_key")
            result = client.extract_text(data)
        assert result["meta"]["input_bytes"] == 42

    def test_image_sent_as_base64_data_uri(self):
        mock_post = _make_ocr_client()
        image_bytes = b"PNG_DATA"
        with patch("modules.ocr_client.requests.post", mock_post) as mp:
            client = GLMOCR(api_key="test_key")
            client.extract_text(image_bytes)
        call_kwargs = mp.call_args[1]  # keyword args to requests.post
        payload = call_kwargs.get("json") or mp.call_args[0][1]
        file_field = payload.get("file", "")
        assert file_field.startswith("data:image/png;base64,")
        expected_b64 = base64.b64encode(image_bytes).decode()
        assert expected_b64 in file_field

    def test_bearer_token_in_headers(self):
        mock_post = _make_ocr_client()
        with patch("modules.ocr_client.requests.post", mock_post) as mp:
            client = GLMOCR(api_key="my_secret_key")
            client.extract_text(b"img")
        headers = mp.call_args[1].get("headers") or {}
        assert headers.get("Authorization") == "Bearer my_secret_key"

    def test_api_error_raises_runtime_error(self):
        import requests as req_lib
        mock_post = MagicMock(side_effect=req_lib.exceptions.RequestException("timeout"))
        with patch("modules.ocr_client.requests.post", mock_post):
            client = GLMOCR(api_key="test_key")
            with pytest.raises(RuntimeError, match="GLM-OCR API error"):
                client.extract_text(b"img")

    def test_missing_api_key_raises_value_error(self):
        # Temporarily remove the env var so the default path triggers.
        original = os.environ.pop("BIGMODEL_API_KEY", None)
        try:
            with pytest.raises(ValueError, match="BIGMODEL_API_KEY"):
                GLMOCR(api_key=None)
        finally:
            if original is not None:
                os.environ["BIGMODEL_API_KEY"] = original


# ---------------------------------------------------------------------------
# GLMOCR.extract_text_from_url
# ---------------------------------------------------------------------------

class TestGLMOCRFromUrl:
    def test_url_passed_directly_in_payload(self):
        mock_post = _make_ocr_client({"text": "URL OCR result"})
        url = "https://example.com/image.png"
        with patch("modules.ocr_client.requests.post", mock_post) as mp:
            client = GLMOCR(api_key="test_key")
            result = client.extract_text_from_url(url)
        payload = mp.call_args[1].get("json") or {}
        assert payload.get("file") == url
        assert result["text"] == "URL OCR result"
