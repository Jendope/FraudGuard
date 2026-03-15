# HK FraudGuard — AI 詐騙檢測系統

> **畢業專題** — 使用大型語言模型 (LLMs) 和檢索增強生成 (RAG) 的詐騙檢測系統

**其他語言**: [English](README.md) · [简体中文](README.zh-hans.md)

利用大型語言模型和 RAG 技術，比對 606 宗已驗證的香港詐騙案例，進行智能詐騙檢測。

---

## 快速開始

### 系統需求

- **Python 3.11+** — [下載](https://www.python.org/downloads/)
- **Node.js 18+** — [下載](https://nodejs.org/)
- **Git** — [下載](https://git-scm.com/downloads)
- API 金鑰（有免費額度）：
  - [DashScope](https://dashscope.console.aliyun.com/)（Qwen LLM）
  - [BigModel / ZhipuAI](https://open.bigmodel.cn/)（GLM-OCR + GLM-5）

> **可以用哪種終端？** 以下所有命令都適用於 **Bash**（macOS / Linux）、**PowerShell** 和 **命令提示字元**（Windows）。如果命令在不同平台有差異，會全部列出。

### 第 1 步 — 複製並設定

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone
```

複製範例環境檔並填入 API 金鑰：

| 終端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `cp .env.example .env` |
| **PowerShell** | `Copy-Item .env.example .env` |
| **命令提示字元** | `copy .env.example .env` |

用任意文字編輯器開啟 `.env`，設定兩個**必填**金鑰：

```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
BIGMODEL_API_KEY=your_bigmodel_api_key_here
```

接著將根目錄 `.env` 複製到 `FrauGuard` 目錄，供獨立開發時使用：

| 終端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `cp .env FrauGuard/.env` |
| **PowerShell** | `Copy-Item .env FrauGuard\.env` |
| **命令提示字元** | `copy .env FrauGuard\.env` |

> **說明：** 兩個檔案均已加入 `.gitignore`，API 金鑰不會被提交到儲存庫。

### 第 2 步 — 建立 Python 虛擬環境

```bash
python -m venv .venv
```

啟用虛擬環境：

| 終端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `source .venv/bin/activate` |
| **PowerShell** | `.venv\Scripts\Activate.ps1` |
| **命令提示字元** | `.venv\Scripts\activate.bat` |

> 下面每個終端視窗都需要先啟用虛擬環境。

### 第 3 步 — 啟動後端

開啟一個**新終端**（再次啟用虛擬環境），然後：

```bash
cd backend
pip install -r requirements.txt
python app.py
```

後端啟動在 **http://localhost:5000**。首次請求時，RAG 向量資料庫會自動從 `hk01_scam_articles.md` 建構。保持此終端視窗開啟。

### 第 4 步 — 啟動網頁介面

再開啟一個**新終端**：

```bash
cd FrauGuard
npm install
npm run dev
```

網頁介面啟動在 **http://localhost:3000**。在瀏覽器中開啟它。

### 準備就緒！

在瀏覽器中開啟 **http://localhost:3000**。你會看到**專案首頁**，其中包含專案資訊。點擊 **Try Demo** 進入 **RAG 管道示範**介面，你可以：
- **上傳圖片** — OCR 擷取文字，然後 LLM 分析是否涉及詐騙
- **輸入或貼上文字** — 直接傳送給 LLM 進行詐騙分析
- **切換 Raw LLM 和 LLM + RAG 模式** — 對比 RAG 如何提高準確度

> **提示：** RAG 向量資料庫會在首次使用時自動從 `backend/hk01_scam_articles.md` 建構。

---

## 如何試用各項功能

### 使用網頁介面（推薦）

開啟 http://localhost:3000/demo 存取互動式示範：

1. **試用 RAG 管道：**
   - 開啟 http://localhost:3000/demo
   - 將模式切換為 **LLM + RAG**
   - 貼上一條可疑訊息（例如 *"恭喜你中了 HK$50,000！點擊此連結領取獎金。"*）或上傳可疑截圖
   - 點擊**分析** — 系統會從知識庫中檢索相似的詐騙案例並交叉比對
   - 切換到 **Raw LLM** 模式對比結果差異

2. **試用 OCR（圖片分析）：**
   - 點擊上傳區域，選擇一張圖片（可疑短訊、WhatsApp 訊息截圖等）
   - 系統透過 GLM-OCR 擷取文字，然後用 LLM 分析

### 使用 API 直接測試（curl / PowerShell）

如果你更喜歡命令列測試，後端提供 REST 介面：

**健康檢查：**

| 終端 | 命令 |
|------|------|
| **Bash** | `curl http://localhost:5000/api/health` |
| **PowerShell** | `Invoke-RestMethod http://localhost:5000/api/health` |
| **命令提示字元** | `curl http://localhost:5000/api/health` |

**文字分析：**

```bash
# Bash / 命令提示字元
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"恭喜你中了 HK$50,000！點擊領取。\"}"
```

```powershell
# PowerShell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "恭喜你中了 HK$50,000！點擊領取。"}'
```

**文字分析（指定提示語言 — `en`、`zh-cn` 或 `zh-tw`）：**

```bash
# Bash / 命令提示字元 — 使用繁體中文提示
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"恭喜你中了 HK$50,000！點擊領取。\", \"language\": \"zh-tw\"}"
```

```powershell
# PowerShell — 使用簡體中文提示
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "恭喜你中了 HK$50,000！點擊領取。", "language": "zh-cn"}'
```

---

## 其他安裝方式

### 方式 A — 自動安裝（僅限 macOS / Linux）

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone
bash setup.sh
```

然後編輯 `.env` 設定 API 金鑰，接著按照上面的第 3–4 步操作。

### 方式 B — Docker（一鍵啟動）

```bash
# Bash / 命令提示字元
cp .env.example .env
docker compose up --build
```

```powershell
# PowerShell
Copy-Item .env.example .env
docker compose up --build
```

先編輯 `.env` 設定 `DASHSCOPE_API_KEY` 和 `BIGMODEL_API_KEY`，然後在瀏覽器中開啟 **http://localhost:3000**。

### 方式 C — Vercel（僅前端部署）

Next.js 網頁介面可部署至 [Vercel](https://vercel.com)。後端需另外部署（例如 Railway、Render 或 DigitalOcean）。

1. 將此倉庫推送至 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 匯入專案
3. 將 **Root Directory** 設為 `FrauGuard`
4. 設定環境變數：
   - `NEXT_PUBLIC_API_BASE` — 後端 URL（例如 `https://your-backend.onrender.com`）
   - `NEXT_PUBLIC_GITHUB_REPO_URL` — GitHub 倉庫 URL
5. 部署

---

## 運作原理

- **OCR 文字擷取** — GLM-OCR（BigModel）從上傳圖片中自動擷取文字
- **LLM 分析** — Qwen（DashScope）/ GLM-5（BigModel）分析擷取的文字以識別詐騙指標
- **RAG 情境檢索** — 比對 606 宗真實香港詐騙案例以提高準確度

**兩種分析模式（在介面中切換，或透過 API 的 `mode` 參數指定）：**
- **Raw LLM** — 快速直接分析
- **LLM + RAG** — 交叉比對 606 宗已驗證案例（86.4% 準確率，無 RAG 時為 71.2%）

**三種提示語言（透過 API 的 `language` 參數指定）：**

| 代碼 | 語言 | 說明 |
|------|------|------|
| `en` | English | 預設 — 英文提示和理由 |
| `zh-cn` | 简体中文 | 簡體中文提示，適合大陸用戶 |
| `zh-tw` | 繁體中文 | 繁體中文提示，適合港澳台用戶 |

---

## 多語言支援

介面支援 **English**、**繁體中文** 和 **简体中文**。

- 每個頁面右上角均有語言切換按鈕
- 語言偏好跨工作階段儲存於 `localStorage`
- 長者教學指南已完整翻譯為三種語言（大字體、高對比度、簡明語言）

---

## 驗證結果與基準測試

| 指標 | 數值 | 說明 |
|---|---|---|
| HKMA 對齊率 | **86.4%** | 與金管局已驗證詐騙模式的對齊程度 |
| 驗證樣本 | 85 個 | 人工標註的測試樣本 |
| 知識庫 | 606 篇文章 | HK01 詐騙案例（2024年1月 – 2026年2月） |
| 檢索 Top-K | 3 | 每次查詢檢索的相似案例數 |

### 與基線方法比較

| 方法 | 準確率 | 可解釋性 | 情境 |
|---|---|---|---|
| 僅 LLM（無 RAG） | 71.2% | 低 | 無案例參考 |
| **LLM + RAG（本方案）** | **86.4%** | **高** | **引用相似已驗證案例** |

---

## 環境變數

**根目錄 `.env`（後端和網頁介面共用）：**

| 變數 | 預設值 | 用途 |
|---|---|---|
| `DASHSCOPE_API_KEY` | — | **必填** — 阿里雲 DashScope（Qwen LLM） |
| `BIGMODEL_API_KEY` | — | **必填** — BigModel / ZhipuAI（GLM-OCR + GLM-5） |
| `ZAI_API_KEY` | — | **必填** — 網頁介面 BigModel 金鑰（與 `BIGMODEL_API_KEY` 值相同） |
| `ZAI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | BigModel API 基礎 URL |
| `LLM_MODEL` | `qwen3.5-plus` | LLM 模型 — 可自由切換 |
| `DEFAULT_MODE` | `raw` | 預設模式（`raw` / `rag`） |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:5000` | 網頁介面 → 後端 URL |

> **獨立開發說明：** 使用 `npm run dev` 而非 Docker 時，需將根目錄 `.env` 複製到 `FrauGuard/.env`：`cp .env FrauGuard/.env`。使用 Docker Compose 時，所有變數會自動注入。

---

## 執行測試

```bash
cd backend
pytest tests/ -v
```

---

## 授權

本專案為 VTC 畢業專題之學術研究原型。
