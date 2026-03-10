# HK FraudGuard

> **Final-Year Project** — Fraud Detection Using Large Language Models and Retrieval-Augmented Generation

**Other languages**: [繁體中文](README.zh-hant.md) · [简体中文](README.zh-hans.md)

AI-powered fraud detection for Hong Kong. Analyses suspicious messages using LLMs cross-referenced against 606 verified fraud cases from HK01 news.

| Name              | Student ID | Email                    |
|-------------------|------------|--------------------------|
| Tan James Anthroi | 240350922  | 240350922@stu.vtc.edu.hk |
| Lin Yueying       | 240444846  | 240444846@stu.vtc.edu.hk |
| Tan Xiuhao        | 240253372  | 240253372@stu.vtc.edu.hk |

---

## Quick Start

### Prerequisites

Python 3.11+, Node.js 18+, ffmpeg, and a [DashScope API key](https://dashscope.console.aliyun.com/).

### Option A — Automated Setup (macOS / Linux)

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
bash setup.sh
```

Then edit `.env` and set your `DASHSCOPE_API_KEY`.

### Option B — Manual Setup

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
cp .env.example .env       # edit .env and set DASHSCOPE_API_KEY
```

> **Windows**: use `Copy-Item .env.example .env` in PowerShell.

**Install and run** (in separate terminals):

```bash
# 1. RAG database (one-time setup)
cd rag-pipeline
pip install -r requirements.txt notebook
jupyter notebook                 # run main.ipynb to build ChromaDB

# 2. Backend
cd backend
pip install -r requirements.txt
python app.py                    # http://localhost:5000

# 3. Frontend
cd frontend
npm install && npm run dev       # http://localhost:5173
```

### Option C — Docker

```bash
cp .env.example .env             # set DASHSCOPE_API_KEY
docker compose up --build        # http://localhost
```

### Option D — Vercel (Frontend)

The React frontend can be deployed to [Vercel](https://vercel.com) as a static site. The backend must be hosted separately (e.g. Railway, Render, or DigitalOcean) since it requires Python, ffmpeg, and ML models.

1. Push this repo to GitHub
2. Import the project in [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects the `vercel.json` config
4. Set the environment variable `VITE_API_BASE` to your backend URL (e.g. `https://your-backend.onrender.com`)
5. Deploy

The dashboard (`dashboard/`) can be deployed as a separate Vercel project by setting the **Root Directory** to `dashboard` in Vercel project settings.

---

## How It Works

```
  Upload image/audio  ──>  React Frontend  ──>  Flask Backend
                                |                     |
                         Language Toggle         OCR (GLM-OCR)
                         (EN / 繁體 / 简体)      LLM (DeepSeek)
                                |                RAG (606 cases)
                         Elderly-friendly        Whisper (STT)
                         Tutorial                     |
                                |                     |
                         Results  <───────────────────┘
```

**Two analysis modes:**
- **Raw LLM** — fast direct analysis
- **LLM + RAG** — cross-references 606 verified HK fraud cases for higher accuracy

---

## Multilingual Support

The interface supports **English**, **Traditional Chinese** (Hong Kong), and **Simplified Chinese** (Mainland China).

- Language toggle in the top-right corner of every page
- Language preference persisted in `localStorage`
- Elderly-friendly tutorial fully translated (large text, high contrast, plain language)

---

## Project Structure

```
fraudguard/
├── backend/              Flask API (OCR, LLM, RAG, Whisper)
│   ├── app.py            Main server (/process, /transcribe)
│   ├── ocr/              GLM-OCR module
│   ├── llm/              LLM + RAG implementation
│   ├── whisper/          Speech-to-text module
│   └── tests/            pytest test suite
├── frontend/             React UI (Vite)
│   ├── src/
│   │   ├── App.jsx       Root component
│   │   ├── i18n.jsx      Trilingual translations + context
│   │   └── components/   UI components
│   └── tests/            Vitest test suite
├── rag-pipeline/         RAG pipeline notebooks + ChromaDB
├── dashboard/            Next.js project website
├── data-collection/      Web scraping notebooks
├── docs/
│   ├── reports/          Academic reports (.docx, .xlsx)
│   ├── TOGGLE.md         Mode toggle documentation
│   ├── OCR_INTEGRATION.md
│   └── EXTENDING.md      Developer guide
├── setup.sh              Automated setup script
└── docker-compose.yml
```

---

## Environment Variables

Only `DASHSCOPE_API_KEY` is required. All others have sensible defaults.

| Variable | Default | Purpose |
|---|---|---|
| `DASHSCOPE_API_KEY` | — | **Required** — DashScope API key |
| `OCR_MODEL` | `zai-org/GLM-OCR` | OCR model |
| `LLM_MODEL` | `deepseek/deepseek-llm` | LLM model |
| `DEFAULT_MODE` | `raw` | Default mode (`raw` / `rag`) |
| `RAG_TOP_K` | `3` | RAG retrieval count |
| `WHISPER_MODEL` | `base` | Whisper model size |
| `WHISPER_DEVICE` | `cpu` | `cpu` or `cuda` |

See `.env.example` for all options.

---

## Running Tests

```bash
cd backend  && pytest tests/ -v     # backend
cd frontend && npm test             # frontend (26 tests)
```

---

## Benchmarks and Validation

### RAG Pipeline Performance

| Metric | Value | Description |
|---|---|---|
| HKMA Alignment | **86.4%** | Alignment with HKMA-verified scam patterns |
| Validation Set | 85 samples | Manually annotated test samples |
| Knowledge Base | 606 articles | HK01 fraud cases (Jan 2024 – Feb 2026) |
| Retrieval Top-K | 3 | Similar cases retrieved per query |
| Embedding Dim. | 768 | Sentence-BERT vector dimensions |
| Similarity Metric | Cosine | ChromaDB retrieval method |

### Model Specifications

| Component | Model | Parameters | Source |
|---|---|---|---|
| LLM | DeepSeek-v3.2 | — | Alibaba Cloud DashScope API |
| Embeddings | shibing624/text2vec-base-chinese | 110M | Sentence-BERT fine-tuned for Chinese |
| OCR | GLM-OCR (zai-org/GLM-OCR) | 0.9B | GLM-V encoder-decoder architecture |
| STT | OpenAI Whisper | 74M (base) | Open-source speech recognition |

### Comparison with Baseline

| Method | Accuracy | Explainability | Context |
|---|---|---|---|
| LLM Only (no RAG) | 71.2% | Low | No case references |
| **LLM + RAG (ours)** | **86.4%** | **High** | **References similar verified cases** |

> Validation performed on a held-out test set of 85 manually annotated samples against HKMA-verified scam patterns.

---

## References

1. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*, 33, 9459–9474. https://arxiv.org/abs/2005.11401
2. Reimers, N. & Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *EMNLP-IJCNLP 2019*. https://arxiv.org/abs/1908.10084
3. Radford, A., et al. (2023). "Robust Speech Recognition via Large-Scale Weak Supervision." *ICML 2023*. https://arxiv.org/abs/2212.04356
4. DeepSeek-AI. (2024). "DeepSeek LLM: Scaling Open-Source Language Models with Longtermism." https://arxiv.org/abs/2401.02954
5. Chroma. (2023). "Chroma: The AI-native open-source embedding database." https://www.trychroma.com/
6. Hong Kong Monetary Authority. (2024). "Fraud and Scam Prevention." https://www.hkma.gov.hk/
7. Hong Kong Police Force. (2024). "Anti-Deception Coordination Centre (ADCC)." https://www.adcc.gov.hk/
8. Office of the Privacy Commissioner for Personal Data, Hong Kong. "Personal Data (Privacy) Ordinance (Cap. 486)." https://www.pcpd.org.hk/

---

## Ethical Compliance

- All data is publicly available information published for public awareness
- No personally identifiable information (PII) is extracted or stored
- Compliant with Hong Kong Personal Data (Privacy) Ordinance (Cap. 486)
- System strictly performs detection — no fraudulent content is generated

---

## License

Academic research prototype — VTC Final-Year Project.
