# HK FraudGuard — AI 詐騙檢測系統

> **畢業專題** — 使用大型語言模型 (LLMs) 和檢索增強生成 (RAG) 的詐騙檢測系統

**其他語言**: [English](README.md) · [简体中文](README.zh-hans.md)

利用大型語言模型和 RAG 技術，比對 606 宗已驗證的香港詐騙案例，進行智能詐騙檢測。

---

## 快速開始

### 系統需求

Python 3.11+、Node.js 18+、ffmpeg，以及 [DashScope API 金鑰](https://dashscope.console.aliyun.com/)。

### 方式 A — 自動安裝（macOS / Linux）

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
bash setup.sh
```

然後編輯 `.env`，設定 `DASHSCOPE_API_KEY`。

### 方式 B — 手動安裝

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
cp .env.example .env       # 編輯 .env，設定 DASHSCOPE_API_KEY
```

> **Windows 用戶**：使用 `Copy-Item .env.example .env`（PowerShell）。

**分別啟動各組件**（在不同終端視窗）：

```bash
# 1. 建立 RAG 資料庫（僅需一次）
cd rag-pipeline
pip install -r requirements.txt notebook
jupyter notebook                 # 執行 main.ipynb 建立 ChromaDB

# 2. 啟動後端
cd backend
pip install -r requirements.txt
python app.py                    # http://localhost:5000

# 3. 啟動前端
cd frontend
npm install && npm run dev       # http://localhost:5173
```

### 方式 C — Docker（一鍵啟動）

```bash
cp .env.example .env             # 先設定 DASHSCOPE_API_KEY
docker compose up --build        # http://localhost
```

### 方式 D — Vercel（前端部署）

React 前端可部署至 [Vercel](https://vercel.com) 作為靜態網站。後端需另外部署（例如 Railway、Render 或 DigitalOcean），因其需要 Python、ffmpeg 和 ML 模型。

1. 將此倉庫推送至 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 匯入專案
3. Vercel 會自動偵測 `vercel.json` 配置
4. 設定環境變數 `VITE_API_BASE` 為後端 URL（例如 `https://your-backend.onrender.com`）
5. 部署

---

## 運作原理

- **OCR 文字擷取** — GLM-OCR 從上傳圖片中自動擷取文字
- **LLM 分析** — DeepSeek LLM 分析擷取的文字以識別詐騙指標
- **RAG 情境檢索** — 比對 606 宗真實香港詐騙案例以提高準確度
- **語音轉文字** — OpenAI Whisper 支援音訊分析

**兩種分析模式：**
- **Raw LLM** — 快速直接分析
- **LLM + RAG** — 交叉比對 606 宗已驗證案例（更準確）

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

## 執行測試

```bash
cd backend  && pytest tests/ -v     # 後端測試
cd frontend && npm test             # 前端測試
```

---

## 授權

本專案為 VTC 畢業專題之學術研究原型。
