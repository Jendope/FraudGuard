# Extending the Pipeline — Developer Guide

## Interface Contracts

All pluggable components expose minimal, documented interfaces so they can be
swapped without touching the rest of the codebase.

### OCR client

```python
class MyOCRClient:
    def extract_text(self, image_bytes: bytes) -> dict:
        """
        Returns:
            {
                "text": str,          # normalized extracted text
                "raw":  Any,          # unmodified model output
                "meta": dict,         # provenance (model name, input size, …)
            }
        """
        ...
```

### LLM client

```python
class MyLLMClient:
    def ask(self, prompt: str) -> str:
        """Returns the model's reply as a plain string."""
        ...
```

### RAG client

```python
class MyRAGClient:
    def index_documents(self, documents: list[str]) -> None:
        """Chunk, embed, and index a list of texts (replaces previous index)."""
        ...

    def retrieve(self, query: str, top_k: int = 3) -> list[str]:
        """Return the top_k most relevant passages for query."""
        ...
```

---

## Adding a New LLM

1. Create a class in `backend/llm/llm_client.py` (or a new file) that
   implements `ask(prompt: str) -> str`.

   ```python
   class MyNewLLMClient:
       def __init__(self, model_name: str, **kwargs):
           from transformers import pipeline
           self._pipe = pipeline("text-generation", model=model_name, **kwargs)
           self.model_name = model_name

       def ask(self, prompt: str) -> str:
           outputs = self._pipe(prompt)
           return outputs[0]["generated_text"][len(prompt):].strip()
   ```

2. Register it in `backend/llm/llm_factory.py`:

   ```python
   from .llm_client import MyNewLLMClient

   _REGISTRY = {
       ...
       "my-org/my-model": MyNewLLMClient,
   }
   ```

3. Set the environment variable:

   ```bash
   LLM_MODEL=my-org/my-model python backend/app.py
   ```

---

## Adding a New OCR Engine

1. Create a class in (or alongside) `backend/ocr/ocr_client.py` that
   implements `extract_text(image_bytes: bytes) -> dict`.

2. In `backend/app.py`, update `_get_ocr_client()` to select the correct
   class based on the `OCR_MODEL` env var (or add a factory similar to
   `llm_factory.py`).

---

## Swapping the Vector Store

The current RAG implementation uses a simple numpy-based in-memory index.
To use a production-grade vector store:

### FAISS (local, high-performance)

```python
import faiss, numpy as np

class FAISSRAGClient:
    def __init__(self, dim: int = 384):
        self._index = faiss.IndexFlatIP(dim)  # inner product == cosine on unit vecs
        self._chunks: list[str] = []

    def index_documents(self, documents):
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        # chunk + embed ...
        vectors = embedder.encode(all_chunks, normalize_embeddings=True)
        self._index.add(np.array(vectors, dtype=np.float32))
        self._chunks = all_chunks

    def retrieve(self, query, top_k=3):
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        q = embedder.encode([query], normalize_embeddings=True)
        _, indices = self._index.search(np.array(q, dtype=np.float32), top_k)
        return [self._chunks[i] for i in indices[0] if i >= 0]
```

### Pinecone (cloud)

```python
import pinecone

class PineconeRAGClient:
    def __init__(self, api_key, index_name):
        pinecone.init(api_key=api_key)
        self._index = pinecone.Index(index_name)

    def index_documents(self, documents):
        # embed and upsert vectors ...
        pass

    def retrieve(self, query, top_k=3):
        # embed query and query index ...
        pass
```

### Milvus (self-hosted)

Use the `pymilvus` SDK with the same `index_documents` / `retrieve` interface.

---

## Adding Frontend Pages

The React frontend uses plain Vite + React.  To add a new page:

1. Create `frontend/src/pages/MyPage.jsx`.
2. Add a route in `frontend/src/App.jsx` using `react-router-dom`.
3. Add a nav link in the main layout.

---

## Environment Variables Quick Reference

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_MODE` | `raw` | Default processing mode (`raw` or `rag`) |
| `OCR_MODEL` | `zai-org/GLM-OCR` | Hugging Face OCR model ID |
| `LLM_MODEL` | `deepseek/deepseek-llm` | Hugging Face LLM model ID |
| `EMBED_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Sentence embedder model ID |
| `RAG_TOP_K` | `3` | Number of passages to retrieve |
| `RAG_CHUNK_SIZE` | `200` | Words per text chunk |
| `HOST` | `0.0.0.0` | Flask server host |
| `PORT` | `5000` | Flask server port |
| `DEBUG` | `false` | Enable Flask debug mode |
