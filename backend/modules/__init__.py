"""
modules package - Consolidated OCR, LLM, and RAG clients.

Public API
----------
from modules.ocr_client import GLMOCR
from modules.llm_factory import get_llm_client
from modules.rag_client import RAGClient
"""

from .llm_factory import get_llm_client
from .ocr_client import GLMOCR
from .rag_client import RAGClient

__all__ = ["GLMOCR", "get_llm_client", "RAGClient"]
