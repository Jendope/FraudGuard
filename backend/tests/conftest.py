"""
conftest.py - Shared pytest configuration for backend tests.

Sets up environment variables and patches module-level model loading so
that tests can import backend.app without downloading any weights.
"""

import os
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Ensure required env vars are present before any module-level code runs
# ---------------------------------------------------------------------------
os.environ.setdefault("DASHSCOPE_API_KEY", "test_key_for_tests")
os.environ.setdefault("LLM_MODEL", "deepseek/deepseek-llm")
os.environ.setdefault("OCR_MODEL", "zai-org/GLM-OCR")
os.environ.setdefault("DEFAULT_MODE", "raw")
