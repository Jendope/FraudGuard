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

## Two Interfaces

The project provides **two user-facing interfaces**, both served from a single Next.js application:

| Interface | URL | Purpose |
|-----------|-----|---------|
| **Landing Page** | `http://localhost:3000` | Project information, features, team, and benchmarks |
| **RAG Pipeline Demo** | `http://localhost:3000/demo` | Interactive fraud detection and OCR image analysis |

---

## Quick Start

### Prerequisites

- **Python 3.11+** — [download](https://www.python.org/downloads/)
- **Node.js 18+** — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/downloads)
- API keys (free tier available):
  - [DashScope](https://dashscope.console.aliyun.com/) — Qwen LLM
  - [BigModel / ZhipuAI](https://open.bigmodel.cn/) — GLM-OCR + GLM-5

> **Which shell can I use?** All commands below work in **Bash** (macOS / Linux), **PowerShell**, and **Command Prompt** (Windows). Where a command differs between platforms, all variants are shown.

### Step 1 — Clone and configure

```bash
git clone https://github.com/Jendope/FraudGuard.git
cd FraudGuard
```

Copy the example environment file and fill in your API keys:

| Shell | Command |
|-------|---------|
| **Bash** (macOS / Linux) | `cp .env.example .env` |
| **PowerShell** | `Copy-Item .env.example .env` |
| **Command Prompt** | `copy .env.example .env` |

Open `.env` in any text editor and set the two **required** keys:

```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
BIGMODEL_API_KEY=your_bigmodel_api_key_here
```

Then copy the same file to the `FrauGuard` directory so the web interface can read the same keys:

| Shell | Command |
|-------|---------|
| **Bash** (macOS / Linux) | `cp .env FrauGuard/.env` |
| **PowerShell** | `Copy-Item .env FrauGuard\.env` |
| **Command Prompt** | `copy .env FrauGuard\.env` |

> **Note:** Both files are gitignored — your API keys are never committed to the repository.

### Step 2 — Create a Python virtual environment

```bash
python -m venv .venv
```

Activate it:

| Shell | Command |
|-------|---------|
| **Bash** (macOS / Linux) | `source .venv/bin/activate` |
| **PowerShell** | `.venv\Scripts\Activate.ps1` |
| **Command Prompt** | `.venv\Scripts\activate.bat` |

> Keep this virtual environment activated for every terminal you open below.

### Step 3 — Start the backend

Open a **new terminal** (activate the venv again), then:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend starts at **http://localhost:5000**. On first request, the RAG vector store will be built automatically from `hk01_scam_articles.md`. Keep this terminal open.

### Step 4 — Start the web interface

Open another **new terminal**, then:

```bash
cd FrauGuard
npm install
npm run dev
```

The web interface starts at **http://localhost:3000**. Open it in your browser.

### You're ready!

Open **http://localhost:3000** in your browser. You'll see the **Landing Page** with project information. Click **Try Demo** to open the **RAG Pipeline Demo** where you can:
- **Upload an image** — OCR extracts the text, then the LLM analyses it for fraud
- **Type or paste text** — send it directly to the LLM for fraud analysis
- **Toggle between Raw LLM and LLM + RAG mode** — see how RAG improves accuracy

> **Note:** The RAG vector store is built automatically on first use from `backend/hk01_scam_articles.md`.

---

## Trying It Out

### Using the Web UI (recommended)

Open http://localhost:3000/demo to access the interactive demo:

1. **Try the RAG pipeline:**
   - Open http://localhost:3000/demo
   - Switch the mode toggle to **LLM + RAG**
   - Paste a suspicious message (e.g. *"You have won HK$50,000! Click this link to claim your prize."*) or upload a screenshot of one
   - Click **Analyse** — the system retrieves similar fraud cases from the knowledge base and cross-references them
   - Compare the result with **Raw LLM** mode to see the difference

2. **Try OCR (image analysis):**
   - Click the upload area and select an image (screenshot of a suspicious SMS, WhatsApp message, etc.)
   - The system extracts the text via GLM-OCR, then analyses it with the LLM

### Using the API directly (curl / PowerShell)

If you prefer testing from the command line, the backend exposes REST endpoints. Examples:

**Health check:**

| Shell | Command |
|-------|---------|
| **Bash** | `curl http://localhost:5000/api/health` |
| **PowerShell** | `Invoke-RestMethod http://localhost:5000/api/health` |
| **Command Prompt** | `curl http://localhost:5000/api/health` |

**Analyse text (Raw LLM):**

```bash
# Bash / Command Prompt
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"You won HK$50,000! Click here to claim.\"}"
```

```powershell
# PowerShell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "You won HK$50,000! Click here to claim."}'
```

**Analyse text (with language — `en`, `zh-cn`, or `zh-tw`):**

```bash
# Bash / Command Prompt — Simplified Chinese prompt
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"You won HK$50,000! Click here to claim.\", \"language\": \"zh-cn\"}"
```

```powershell
# PowerShell — Traditional Chinese prompt
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "You won HK$50,000! Click here to claim.", "language": "zh-tw"}'
```

**OCR — process an image:**

```bash
# Bash / Command Prompt
curl -X POST http://localhost:5000/process \
  -F "file=@screenshot.png" \
  -F "mode=rag"
```

```powershell
# PowerShell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/process `
  -Form @{ file = Get-Item screenshot.png; mode = "rag" }
```

---

## Alternative Setup Methods

### Option A — Automated Setup (macOS / Linux only)

```bash
git clone https://github.com/Jendope/FraudGuard.git
cd FraudGuard
bash setup.sh
```

Then edit `.env` and set your API keys, and follow Steps 3–4 above.

### Option B — Docker (one command)

```bash
# Bash / Command Prompt
cp .env.example .env
docker compose up --build
```

```powershell
# PowerShell
Copy-Item .env.example .env
docker compose up --build
```

Edit `.env` first to set `DASHSCOPE_API_KEY` and `BIGMODEL_API_KEY`, then open **http://localhost:3000** in your browser.

### Option C — Vercel (web interface only)

The Next.js web interface can be deployed to [Vercel](https://vercel.com). The backend must be hosted separately (e.g. Railway, Render, or DigitalOcean).

1. Push this repo to GitHub
2. Import the project in [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `FrauGuard`
4. Set the following environment variables in Vercel:
   - `NEXT_PUBLIC_API_BASE` — your backend URL (e.g. `https://your-backend.onrender.com`)
   - `NEXT_PUBLIC_GITHUB_REPO_URL` — your GitHub repo URL (defaults to `https://github.com/Jendope/FraudGuard`)
5. Deploy

---

## How It Works

```
  Landing Page (/) ────────> Project info, features, benchmarks, team
                  \
                   ┌──────> RAG Demo (/demo) ──> Flask Backend (:5000)
                   │              │                      │
                   │        Interactive UI          OCR (Qwen VL / GLM-OCR)
                   │        Mode toggle             LLM (Qwen via DashScope)
                   │        Model selector          Alt LLM (GLM-5 via BigModel)
                   │              │                 RAG (606 fraud cases)
                   │              │
                   │        Results  <──────────────────────┘
                   │
  Next.js (:3000) ─┘
```

**Two LLM options:**
- **Qwen** (primary) — via DashScope (Singapore region); model name set via `LLM_MODEL` env var (default: `qwen3.5-plus`)
- **GLM-5** (alternative) — via BigModel/ZhipuAI `zai-sdk`; set `LLM_MODEL=glm5/glm5-llm`

**Two analysis modes (toggle in the UI or pass `mode` in the API):**
- **Raw LLM** — sends your text directly to the LLM for fast analysis
- **LLM + RAG** — first retrieves the 3 most similar verified fraud cases from the knowledge base, then sends them alongside your text to the LLM (86.4% accuracy vs 71.2% without RAG)

**Three prompt languages (pass `language` in the API):**

| Code | Language | Description |
|------|----------|-------------|
| `en` | English | Default — prompt and reason in English |
| `zh-cn` | 简体中文 | Simplified Chinese prompt for mainland users |
| `zh-tw` | 繁體中文 | Traditional Chinese prompt for Hong Kong / Taiwan users |

---

## Project Structure

```
FraudGuard/
├── .env.example          Single source of truth for ALL environment variables
├── backend/              Flask API (OCR + LLM + RAG)
│   ├── app.py            Main server (/process, /api/analyze)
│   ├── config.py         Centralized config (reads from .env)
│   ├── hk01_scam_articles.md  Fraud articles data (606 cases)
│   ├── modules/          Consolidated OCR + LLM + RAG logic
│   │   ├── llm_client.py     LLM client implementations (Qwen, GLM-5, DeepSeek, HF)
│   │   ├── llm_factory.py    Factory for model selection + caching
│   │   ├── ocr_client.py     OCR client implementations (Qwen VL, GLM-OCR)
│   │   ├── ocr_factory.py    Factory for OCR engine selection + caching
│   │   └── rag_client.py     In-memory RAG (SentenceTransformer + NumPy)
│   └── tests/            pytest suite (40 tests)
├── FrauGuard/            Next.js web interface
│   ├── src/app/page.tsx  Landing page (marketing)
│   ├── src/app/demo/     RAG pipeline demo
│   └── src/lib/site-config.ts
├── data-collection/      Notebooks, scraping scripts, and daily updates
├── docs/                 Documentation and archived notebooks
├── setup.sh              Setup script
└── docker-compose.yml    Deployment config (backend + web)
```

---

## Environment Variables

Two API keys are required. All others have sensible defaults.

**Root `.env` (used by both the backend and the web interface):**

| Variable | Default | Purpose |
|---|---|---|
| `DASHSCOPE_API_KEY` | — | **Required** — Alibaba Cloud DashScope (Qwen LLM + Qwen VL OCR) |
| `BIGMODEL_API_KEY` | — | **Required** — BigModel / ZhipuAI (GLM-OCR + GLM-5) |
| `ZAI_API_KEY` | — | **Required** — BigModel API key for the web interface (same value as `BIGMODEL_API_KEY`) |
| `ZAI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | BigModel API base URL |
| `LLM_MODEL` | `qwen3.5-plus` | LLM model — **rotate freely** (`qwen3.5-plus`, `qwen-plus`, `qwen-turbo`, `glm5/glm5-llm`, …) |
| `OCR_MODEL` | `qwen-vl-ocr-2025-11-20` | OCR model (`qwen-vl-ocr-2025-11-20` for Qwen VL OCR, or `glm-ocr` for GLM-OCR) |
| `DEFAULT_MODE` | `raw` | Default mode (`raw` / `rag`) |
| `RAG_TOP_K` | `3` | RAG retrieval count |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:5000` | Web interface → backend URL |
| `NEXT_PUBLIC_GITHUB_REPO_URL` | `https://github.com/Jendope/FraudGuard` | GitHub repo link in web interface |

> **Standalone dev note:** `FrauGuard/.env` is only needed when running `npm run dev` without Docker. Copy the root `.env` there: `cp .env FrauGuard/.env`. With Docker Compose, all variables are injected automatically.

> **Tip — rotating LLM models:** just change `LLM_MODEL` in `.env`. Supported out-of-the-box:
> `qwen3.5-plus`, `qwen-plus`, `qwen-turbo`, `qwen-max`, `qwen-long`, `glm5/glm5-llm`, `glm-5`,
> `deepseek-v3`, `deepseek-r1`.
>
> **Tip — swapping OCR engines:** change `OCR_MODEL` in `.env`. Supported:
> `qwen-vl-ocr-2025-11-20` (default, Qwen VL OCR via DashScope), `glm-ocr` (GLM-OCR via BigModel).

See `.env.example` for all options.

---

## Installing Dependencies

Create and activate a virtual environment first:

```bash
python -m venv .venv
```

| Shell | Activate command |
|-------|------------------|
| **Bash** (macOS / Linux) | `source .venv/bin/activate` |
| **PowerShell** | `.venv\Scripts\Activate.ps1` |
| **Command Prompt** | `.venv\Scripts\activate.bat` |

Then install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

This runs the full backend test suite (OCR, RAG, toggle — 40 tests).

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
| LLM (primary) | Qwen (configurable) | — | Alibaba Cloud DashScope API |
| LLM (alt) | GLM-5 | — | BigModel / ZhipuAI via `zai-sdk` |
| Embeddings | BAAI/bge-large-zh-v1.5 | 326M | Sentence-BERT fine-tuned for Chinese |
| OCR (primary) | Qwen VL OCR (configurable) | — | Alibaba Cloud DashScope API |
| OCR (alt) | GLM-OCR | — | BigModel REST API |

---

## References

1. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*, 33, 9459–9474. https://arxiv.org/abs/2005.11401
2. Reimers, N. & Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *EMNLP-IJCNLP 2019*. https://arxiv.org/abs/1908.10084
3. Chroma. (2023). "Chroma: The AI-native open-source embedding database." https://www.trychroma.com/
4. Hong Kong Monetary Authority. (2024). "Fraud and Scam Prevention." https://www.hkma.gov.hk/
5. Hong Kong Police Force. (2024). "Anti-Deception Coordination Centre (ADCC)." https://www.adcc.gov.hk/

---

## Ethical Compliance

- All data is publicly available information published for public awareness
- No personally identifiable information (PII) is extracted or stored
- Compliant with Hong Kong Personal Data (Privacy) Ordinance (Cap. 486)
- System strictly performs detection — no fraudulent content is generated

---

## License

Academic research prototype — VTC Final-Year Project.
