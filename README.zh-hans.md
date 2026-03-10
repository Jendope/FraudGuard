# HK FraudGuard — AI 诈骗检测系统

> **毕业项目** — 使用大型语言模型 (LLMs) 和检索增强生成 (RAG) 的诈骗检测系统

**其他语言**: [English](README.md) · [繁體中文](README.zh-hant.md)

利用大型语言模型和 RAG 技术，比对 606 起已验证的香港诈骗案例，进行智能诈骗检测。

---

## 快速开始

### 系统要求

Python 3.11+、Node.js 18+、ffmpeg，以及 [DashScope API 密钥](https://dashscope.console.aliyun.com/)。

### 方式 A — 自动安装（macOS / Linux）

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
bash setup.sh
```

然后编辑 `.env`，设置 `DASHSCOPE_API_KEY`。

### 方式 B — 手动安装

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone   # FraudGuard
cp .env.example .env       # 编辑 .env，设置 DASHSCOPE_API_KEY
```

> **Windows 用户**：使用 `Copy-Item .env.example .env`（PowerShell）。

**分别启动各组件**（在不同终端窗口）：

```bash
# 1. 构建 RAG 数据库（仅需一次）
cd rag-pipeline
pip install -r requirements.txt notebook
jupyter notebook                 # 运行 main.ipynb 构建 ChromaDB

# 2. 启动后端
cd backend
pip install -r requirements.txt
python app.py                    # http://localhost:5000

# 3. 启动前端
cd frontend
npm install && npm run dev       # http://localhost:5173
```

### 方式 C — Docker（一键启动）

```bash
cp .env.example .env             # 先设置 DASHSCOPE_API_KEY
docker compose up --build        # http://localhost
```

### 方式 D — Vercel（前端部署）

React 前端可部署至 [Vercel](https://vercel.com) 作为静态网站。后端需另外部署（例如 Railway、Render 或 DigitalOcean），因其需要 Python、ffmpeg 和 ML 模型。

1. 将此仓库推送至 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 导入项目
3. Vercel 会自动检测 `vercel.json` 配置
4. 设置环境变量 `VITE_API_BASE` 为后端 URL（例如 `https://your-backend.onrender.com`）
5. 部署

---

## 运作原理

- **OCR 文字提取** — GLM-OCR 从上传图片中自动提取文字
- **LLM 分析** — DeepSeek LLM 分析提取的文字以识别诈骗指标
- **RAG 情境检索** — 比对 606 起真实香港诈骗案例以提高准确度
- **语音转文字** — OpenAI Whisper 支持音频分析

**两种分析模式：**
- **Raw LLM** — 快速直接分析
- **LLM + RAG** — 交叉比对 606 起已验证案例（更准确）

---

## 多语言支持

界面支持 **English**、**繁體中文** 和 **简体中文**。

- 每个页面右上角均有语言切换按钮
- 语言偏好跨会话保存于 `localStorage`
- 长者教学指南已完整翻译为三种语言（大字体、高对比度、简明语言）

---

## 验证结果与基准测试

| 指标 | 数值 | 说明 |
|---|---|---|
| HKMA 对齐率 | **86.4%** | 与金管局已验证诈骗模式的对齐程度 |
| 验证样本 | 85 个 | 人工标注的测试样本 |
| 知识库 | 606 篇文章 | HK01 诈骗案例（2024年1月 – 2026年2月） |
| 检索 Top-K | 3 | 每次查询检索的相似案例数 |

### 与基线方法比较

| 方法 | 准确率 | 可解释性 | 情境 |
|---|---|---|---|
| 仅 LLM（无 RAG） | 71.2% | 低 | 无案例参考 |
| **LLM + RAG（本方案）** | **86.4%** | **高** | **引用相似已验证案例** |

---

## 运行测试

```bash
cd backend  && pytest tests/ -v     # 后端测试
cd frontend && npm test             # 前端测试
```

---

## 许可证

本项目为 VTC 毕业项目之学术研究原型。
