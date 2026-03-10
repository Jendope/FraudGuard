"""
test_ocr.py - Unit tests for the GLM-OCR client.

The transformers pipeline is mocked so tests run without GPU / model weights.
"""

from unittest.mock import MagicMock, patch

import pytest

from ocr.ocr_client import GLMOCR, parse_pipeline_result_to_text, OCR_PROMPT


# ---------------------------------------------------------------------------
# parse_pipeline_result_to_text
# ---------------------------------------------------------------------------

class TestParsePipelineResultToText:
    def test_list_of_dicts_with_generated_text(self):
        result = [{"generated_text": "Hello world"}]
        assert parse_pipeline_result_to_text(result) == "Hello world"

    def test_list_of_dicts_missing_key(self):
        result = [{"other_key": "value"}]
        # Should fall back to str(first)
        text = parse_pipeline_result_to_text(result)
        assert isinstance(text, str)

    def test_single_dict(self):
        result = {"generated_text": "Single dict output"}
        assert parse_pipeline_result_to_text(result) == "Single dict output"

    def test_bare_string(self):
        assert parse_pipeline_result_to_text("bare") == "bare"

    def test_empty_list(self):
        text = parse_pipeline_result_to_text([])
        assert isinstance(text, str)


# ---------------------------------------------------------------------------
# GLMOCR
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_pipeline():
    """Patch transformers.pipeline so no weights are downloaded."""
    with patch("ocr.ocr_client.GLMOCR.__init__") as mock_init:
        # We test the class behaviour via direct attribute injection below.
        mock_init.return_value = None
        yield mock_init


def _make_ocr_client(return_value):
    """Build a GLMOCR with a mocked internal pipeline."""
    client = GLMOCR.__new__(GLMOCR)
    mock_pipe = MagicMock(return_value=return_value)
    client.pipe = mock_pipe
    client.model_name = "zai-org/GLM-OCR"
    return client


class TestGLMOCR:
    def test_extract_text_returns_dict_with_required_keys(self):
        client = _make_ocr_client([{"generated_text": "Sample OCR output"}])
        result = client.extract_text(b"\x89PNG\r\n")
        assert "text" in result
        assert "raw" in result
        assert "meta" in result

    def test_extract_text_normalises_output(self):
        client = _make_ocr_client([{"generated_text": "Invoice #123"}])
        result = client.extract_text(b"fake_image_bytes")
        assert result["text"] == "Invoice #123"

    def test_extract_text_raises_on_non_bytes(self):
        client = _make_ocr_client([])
        with pytest.raises(TypeError):
            client.extract_text("not bytes")  # type: ignore

    def test_ocr_prompt_not_empty(self):
        assert len(OCR_PROMPT) > 10
        assert "extract" in OCR_PROMPT.lower()

    def test_pipeline_receives_ocr_prompt(self):
        client = _make_ocr_client([{"generated_text": "text"}])
        client.extract_text(b"img")
        # Verify the pipeline was called
        client.pipe.assert_called_once()
        call_kwargs = client.pipe.call_args
        # The first positional or keyword argument should contain our prompt
        messages = call_kwargs[1].get("text") or call_kwargs[0][0]
        assert any(OCR_PROMPT in str(m) for m in messages)

    def test_meta_contains_model_name(self):
        client = _make_ocr_client([{"generated_text": "abc"}])
        result = client.extract_text(b"img")
        assert result["meta"]["model"] == "zai-org/GLM-OCR"

    def test_meta_contains_input_bytes(self):
        data = b"x" * 42
        client = _make_ocr_client([{"generated_text": "abc"}])
        result = client.extract_text(data)
        assert result["meta"]["input_bytes"] == 42
