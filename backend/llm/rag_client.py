"""
rag_client.py - Simple in-memory RAG (Retrieval-Augmented Generation) module.

Public interface
----------------
    rag = RAGClient()
    rag.index_documents(["chunk1", "chunk2", ...])
    passages = rag.retrieve("my query", top_k=3)

Architecture
------------
1. ``index_documents`` splits every document into fixed-size word chunks,
   embeds them with a SentenceTransformer, and stores vectors + texts in
   memory (numpy arrays).
2. ``retrieve`` embeds the query, computes cosine similarities against all
   stored vectors, and returns the *top_k* most similar passages.

This is intentionally kept simple so it can run without any external
infrastructure.

Swapping the vector store
--------------------------
* **FAISS** — replace the numpy similarity search with ``faiss.IndexFlatIP``
  for O(log n) lookup at larger scales.
* **Milvus / Pinecone** — implement the same ``index_documents`` / ``retrieve``
  interface backed by the respective SDK.  See docs/EXTENDING.md.
"""

from __future__ import annotations

import logging
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer  # type: ignore

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _chunk_text(text: str, chunk_size: int = 200) -> List[str]:
    """
    Split *text* into non-overlapping chunks of approximately *chunk_size*
    words.

    An exact word-count boundary is used for simplicity; for production use
    a sentence-aware splitter (e.g. spaCy) to avoid cutting mid-sentence.
    """
    words = text.split()
    if not words:
        return []
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


def _cosine_similarity(query_vec: np.ndarray, doc_matrix: np.ndarray) -> np.ndarray:
    """
    Return cosine similarity between a single query vector and a matrix of
    document vectors.  Both inputs are assumed to be L2-normalised.
    """
    # dot product of unit vectors == cosine similarity
    return doc_matrix @ query_vec


# ---------------------------------------------------------------------------
# RAGClient
# ---------------------------------------------------------------------------

class RAGClient:
    """
    In-memory RAG client using SentenceTransformers + numpy similarity search.

    Parameters
    ----------
    embed_model:
        Hugging Face model ID for the sentence embedder.
    chunk_size:
        Approximate number of words per text chunk.
    """

    def __init__(
        self,
        embed_model: str = "sentence-transformers/all-MiniLM-L6-v2",
        chunk_size: int = 200,
    ):
        logger.info("Loading sentence embedder: %s", embed_model)
        self._embedder = SentenceTransformer(embed_model)
        self._chunk_size = chunk_size
        self._chunks: List[str] = []
        self._vectors: np.ndarray | None = None  # shape (n_chunks, dim)
        logger.info("RAGClient ready.")

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def index_documents(self, documents: List[str]) -> None:
        """
        Chunk, embed, and index a list of text documents.

        Calling this method replaces any previously indexed content.

        Parameters
        ----------
        documents:
            Raw text strings (e.g. OCR output from one or more images).
        """
        if not documents:
            logger.warning("index_documents called with empty list — clearing index.")
            self._chunks = []
            self._vectors = None
            return

        all_chunks: List[str] = []
        for doc in documents:
            all_chunks.extend(_chunk_text(doc, self._chunk_size))

        if not all_chunks:
            logger.warning("No chunks produced from documents.")
            self._chunks = []
            self._vectors = None
            return

        logger.info("Embedding %d chunks …", len(all_chunks))
        vectors = self._embedder.encode(
            all_chunks, normalize_embeddings=True, show_progress_bar=False
        )
        self._chunks = all_chunks
        self._vectors = np.array(vectors, dtype=np.float32)
        logger.info("Indexed %d chunks.", len(all_chunks))

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        """
        Return the *top_k* most relevant text chunks for *query*.

        Parameters
        ----------
        query:
            Natural-language query string.
        top_k:
            Maximum number of passages to return.

        Returns
        -------
        List[str] — at most *top_k* passages, ranked by similarity.
        """
        if self._vectors is None or len(self._chunks) == 0:
            logger.warning("retrieve called on empty index — returning [].")
            return []

        # Encode the query; cast to float32 to match the stored vector dtype
        # and to ensure consistent dot-product arithmetic regardless of the
        # embedder's native output precision.
        query_vec = self._embedder.encode(
            [query], normalize_embeddings=True, show_progress_bar=False
        )[0].astype(np.float32)

        scores = _cosine_similarity(query_vec, self._vectors)
        top_k = min(top_k, len(self._chunks))

        # Use argpartition (O(n)) instead of argsort (O(n log n)) to find the
        # top-k indices, then sort only those k elements by score.
        if top_k < len(self._chunks):
            partition_indices = np.argpartition(scores, -top_k)[-top_k:]
            top_indices = partition_indices[np.argsort(scores[partition_indices])[::-1]]
        else:
            top_indices = np.argsort(scores)[::-1]

        results = [self._chunks[i] for i in top_indices]
        logger.debug("Retrieved %d passages for query (%d chars).", len(results), len(query))
        return results

    # ------------------------------------------------------------------
    # Convenience: build a context string for the LLM
    # ------------------------------------------------------------------

    def build_context(self, query: str, top_k: int = 3) -> tuple[List[str], str]:
        """
        Retrieve passages and join them into a single context block.

        Returns
        -------
        (passages, context_string)
        """
        passages = self.retrieve(query, top_k=top_k)
        context = "\n\n---\n\n".join(passages)
        return passages, context
