# RAG Pipeline

> Retrieval-Augmented Generation pipeline for HK FraudGuard fraud detection.

## Setup

```bash
cd rag-pipeline
python -m venv env
source env/bin/activate      # Windows: env\Scripts\activate
pip install -r requirements.txt
pip install notebook
jupyter notebook
```

## Notebooks

Run in order:

1. **`hk01-web-scraping.ipynb`** — scrapes fraud articles from HK01 API → `hk01-scam-articles.md`
2. **`main.ipynb`** — builds ChromaDB vector store and runs the RAG pipeline
3. **`daily-update.ipynb`** — incremental knowledge base updates

> You must run at least `main.ipynb` before starting the backend.

## Output

- `hk01-scam-articles.md` — 606 fraud articles in Markdown
- `chroma_hk01_scam_db/` — ChromaDB vector store (768-dim Sentence-BERT embeddings)
