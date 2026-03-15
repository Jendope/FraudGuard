"""
test_rag.py - Unit tests for the RAGClient.

SentenceTransformer is mocked so tests run without downloading model weights.
"""

from unittest.mock import patch

import numpy as np

# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

def _make_rag_client(embed_dim: int = 8):
    """
    Build a RAGClient with a stubbed SentenceTransformer that returns
    deterministic unit vectors.
    """
    with patch("modules.rag_client.SentenceTransformer") as MockST:
        instance = MockST.return_value

        # encode always returns a normalised matrix of ones scaled by 1/sqrt(dim)
        def fake_encode(texts, normalize_embeddings=True, show_progress_bar=False):
            n = len(texts)
            vec = np.ones((n, embed_dim), dtype=np.float32)
            if normalize_embeddings:
                norms = np.linalg.norm(vec, axis=1, keepdims=True)
                vec = vec / norms
            return vec

        instance.encode.side_effect = fake_encode

        from modules.rag_client import RAGClient
        client = RAGClient.__new__(RAGClient)
        client._embedder = instance
        client._chunk_size = 200
        client._chunks = []
        client._vectors = None
        return client


# ---------------------------------------------------------------------------
# Chunking helper
# ---------------------------------------------------------------------------

class TestChunkText:
    def test_short_text_is_single_chunk(self):
        from modules.rag_client import _chunk_text
        chunks = _chunk_text("hello world", chunk_size=200)
        assert chunks == ["hello world"]

    def test_empty_string_returns_empty_list(self):
        from modules.rag_client import _chunk_text
        assert _chunk_text("") == []

    def test_long_text_is_split(self):
        from modules.rag_client import _chunk_text
        text = " ".join([f"word{i}" for i in range(500)])
        chunks = _chunk_text(text, chunk_size=100)
        assert len(chunks) == 5
        for chunk in chunks:
            assert len(chunk.split()) == 100

    def test_remainder_chunk(self):
        from modules.rag_client import _chunk_text
        text = " ".join([f"w{i}" for i in range(250)])
        chunks = _chunk_text(text, chunk_size=200)
        assert len(chunks) == 2
        assert len(chunks[1].split()) == 50


# ---------------------------------------------------------------------------
# RAGClient.index_documents
# ---------------------------------------------------------------------------

class TestRAGClientIndex:
    def test_index_empty_list_clears_state(self):
        client = _make_rag_client()
        client._chunks = ["stale"]
        client.index_documents([])
        assert client._chunks == []
        assert client._vectors is None

    def test_index_single_document_creates_chunks(self):
        client = _make_rag_client()
        client.index_documents(["word " * 300])  # 300 words → 2 chunks at size 200
        assert len(client._chunks) == 2
        assert client._vectors is not None
        assert client._vectors.shape[0] == 2

    def test_index_multiple_documents(self):
        client = _make_rag_client()
        docs = ["word " * 50, "text " * 50]
        client.index_documents(docs)
        assert len(client._chunks) == 2

    def test_index_replaces_previous_content(self):
        client = _make_rag_client()
        client.index_documents(["first batch"])
        client.index_documents(["second batch"])
        assert client._chunks == ["second batch"]


# ---------------------------------------------------------------------------
# RAGClient.retrieve
# ---------------------------------------------------------------------------

class TestRAGClientRetrieve:
    def test_retrieve_empty_index_returns_empty(self):
        client = _make_rag_client()
        result = client.retrieve("query")
        assert result == []

    def test_retrieve_returns_up_to_top_k(self):
        client = _make_rag_client()
        docs = ["alpha beta gamma", "delta epsilon zeta", "eta theta iota"]
        client.index_documents(docs)
        result = client.retrieve("alpha", top_k=2)
        assert len(result) <= 2

    def test_retrieve_top_k_larger_than_index(self):
        client = _make_rag_client()
        client.index_documents(["only one doc"])
        result = client.retrieve("query", top_k=10)
        assert len(result) == 1

    def test_retrieve_returns_strings(self):
        client = _make_rag_client()
        client.index_documents(["foo bar baz"])
        result = client.retrieve("foo")
        assert all(isinstance(r, str) for r in result)


# ---------------------------------------------------------------------------
# RAGClient.build_context
# ---------------------------------------------------------------------------

class TestRAGClientBuildContext:
    def test_build_context_returns_tuple(self):
        client = _make_rag_client()
        client.index_documents(["some text content"])
        passages, context = client.build_context("query")
        assert isinstance(passages, list)
        assert isinstance(context, str)

    def test_build_context_joins_passages(self):
        client = _make_rag_client()
        client.index_documents(["part1 word " * 10, "part2 text " * 10])
        passages, context = client.build_context("query", top_k=2)
        for passage in passages:
            assert passage in context
