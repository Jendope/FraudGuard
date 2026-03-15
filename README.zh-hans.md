# HK FraudGuard — AI 诈骗检测系统

> **毕业项目** — 使用大型语言模型 (LLMs) 和检索增强生成 (RAG) 的诈骗检测系统

**其他语言**: [English](README.md) · [繁體中文](README.zh-hant.md)

利用大型语言模型和 RAG 技术，比对 606 起已验证的香港诈骗案例，进行智能诈骗检测。

---

## 快速开始

### 系统要求

- **Python 3.11+** — [下载](https://www.python.org/downloads/)
- **Node.js 18+** — [下载](https://nodejs.org/)
- **Git** — [下载](https://git-scm.com/downloads)
- API 密钥（有免费额度）：
  - [DashScope](https://dashscope.console.aliyun.com/)（Qwen LLM）
  - [BigModel / ZhipuAI](https://open.bigmodel.cn/)（GLM-OCR + GLM-5）

> **可以用哪种终端？** 下面所有命令都适用于 **Bash**（macOS / Linux）、**PowerShell** 和 **命令提示符**（Windows）。如果命令在不同平台有差异，会全部列出。

### 第 1 步 — 克隆并配置

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone
```

复制示例环境文件并填入 API 密钥：

| 终端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `cp .env.example .env` |
| **PowerShell** | `Copy-Item .env.example .env` |
| **命令提示符** | `copy .env.example .env` |

用任意文本编辑器打开 `.env`，设置两个**必填**密钥：

```
DASHSCOPE_API_KEY=your_dashscope_api_key_here
BIGMODEL_API_KEY=your_bigmodel_api_key_here
```

接着将根目录 `.env` 复制到 `FrauGuard` 目录，供独立开发时使用：

| 终端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `cp .env FrauGuard/.env` |
| **PowerShell** | `Copy-Item .env FrauGuard\.env` |
| **命令提示符** | `copy .env FrauGuard\.env` |

> **说明：** 两个文件均已加入 `.gitignore`，API 密钥不会被提交到仓库。

### 第 2 步 — 创建 Python 虚拟环境

```bash
python -m venv .venv
```

激活虚拟环境：

| 终端 | 命令 |
|------|------|
| **Bash**（macOS / Linux） | `source .venv/bin/activate` |
| **PowerShell** | `.venv\Scripts\Activate.ps1` |
| **命令提示符** | `.venv\Scripts\activate.bat` |

> 下面每个终端窗口都需要先激活虚拟环境。

### 第 3 步 — 启动后端

打开一个**新终端**（再次激活虚拟环境），然后：

```bash
cd backend
pip install -r requirements.txt
python app.py
```

后端启动在 **http://localhost:5000**。首次请求时，RAG 向量数据库会自动从 `hk01_scam_articles.md` 构建。保持此终端窗口打开。

### 第 4 步 — 启动网页界面

再打开一个**新终端**：

```bash
cd FrauGuard
npm install
npm run dev
```

网页界面启动在 **http://localhost:3000**。在浏览器中打开它。

### 准备就绪！

在浏览器中打开 **http://localhost:3000**。你会看到**项目首页**，其中包含项目信息。点击 **Try Demo** 进入 **RAG 管道演示**界面，你可以：
- **上传图片** — OCR 提取文字，然后 LLM 分析是否涉及诈骗
- **输入或粘贴文字** — 直接发送给 LLM 进行诈骗分析
- **切换 Raw LLM 和 LLM + RAG 模式** — 对比 RAG 如何提高准确度

> **提示：** RAG 向量数据库会在首次使用时自动从 `backend/hk01_scam_articles.md` 构建。

---

## 如何试用各项功能

### 使用网页界面（推荐）

打开 http://localhost:3000/demo 访问交互式演示：

1. **试用 RAG 管道：**
   - 打开 http://localhost:3000/demo
   - 将模式切换为 **LLM + RAG**
   - 粘贴一条可疑消息（例如 *"恭喜你中了 HK$50,000！点击此链接领取奖金。"*）或上传可疑截图
   - 点击**分析** — 系统会从知识库中检索相似的诈骗案例并交叉比对
   - 切换到 **Raw LLM** 模式对比结果差异

2. **试用 OCR（图片分析）：**
   - 点击上传区域，选择一张图片（可疑短信、WhatsApp 消息截图等）
   - 系统通过 GLM-OCR 提取文字，然后用 LLM 分析

### 使用 API 直接测试（curl / PowerShell）

如果你更喜欢命令行测试，后端提供 REST 接口：

**健康检查：**

| 终端 | 命令 |
|------|------|
| **Bash** | `curl http://localhost:5000/api/health` |
| **PowerShell** | `Invoke-RestMethod http://localhost:5000/api/health` |
| **命令提示符** | `curl http://localhost:5000/api/health` |

**文本分析：**

```bash
# Bash / 命令提示符
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"恭喜你中了 HK$50,000！点击领取。\"}"
```

```powershell
# PowerShell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "恭喜你中了 HK$50,000！点击领取。"}'
```

**文本分析（指定提示语言 — `en`、`zh-cn` 或 `zh-tw`）：**

```bash
# Bash / 命令提示符 — 使用简体中文提示
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"恭喜你中了 HK$50,000！点击领取。\", \"language\": \"zh-cn\"}"
```

```powershell
# PowerShell — 使用繁体中文提示
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/analyze `
  -ContentType "application/json" `
  -Body '{"text": "恭喜你中了 HK$50,000！点击领取。", "language": "zh-tw"}'
```

---

## 其他安装方式

### 方式 A — 自动安装（仅限 macOS / Linux）

```bash
git clone https://github.com/Jendope/allinone.git
cd allinone
bash setup.sh
```

然后编辑 `.env` 设置 API 密钥，接着按照上面的第 3–4 步操作。

### 方式 B — Docker（一键启动）

```bash
# Bash / 命令提示符
cp .env.example .env
docker compose up --build
```

```powershell
# PowerShell
Copy-Item .env.example .env
docker compose up --build
```

先编辑 `.env` 设置 `DASHSCOPE_API_KEY` 和 `BIGMODEL_API_KEY`，然后在浏览器中打开 **http://localhost:3000**。

### 方式 C — Vercel（仅前端部署）

Next.js 网页界面可部署至 [Vercel](https://vercel.com)。后端需另外部署（例如 Railway、Render 或 DigitalOcean）。

1. 将此仓库推送至 GitHub
2. 在 [vercel.com/new](https://vercel.com/new) 导入项目
3. 将 **Root Directory** 设为 `FrauGuard`
4. 设置环境变量：
   - `NEXT_PUBLIC_API_BASE` — 后端 URL（例如 `https://your-backend.onrender.com`）
   - `NEXT_PUBLIC_GITHUB_REPO_URL` — GitHub 仓库 URL
5. 部署

---

## 运作原理

- **OCR 文字提取** — GLM-OCR（BigModel）从上传图片中自动提取文字
- **LLM 分析** — Qwen（DashScope）/ GLM-5（BigModel）分析提取的文字以识别诈骗指标
- **RAG 情境检索** — 比对 606 起真实香港诈骗案例以提高准确度

**两种分析模式（在界面中切换，或通过 API 的 `mode` 参数指定）：**
- **Raw LLM** — 快速直接分析
- **LLM + RAG** — 交叉比对 606 起已验证案例（86.4% 准确率，无 RAG 时为 71.2%）

**三种提示语言（通过 API 的 `language` 参数指定）：**

| 代码 | 语言 | 说明 |
|------|------|------|
| `en` | English | 默认 — 英文提示和理由 |
| `zh-cn` | 简体中文 | 简体中文提示，适合大陆用户 |
| `zh-tw` | 繁體中文 | 繁体中文提示，适合港澳台用户 |

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

## 环境变量

**根目录 `.env`（后端和网页界面共用）：**

| 变量 | 默认值 | 用途 |
|---|---|---|
| `DASHSCOPE_API_KEY` | — | **必填** — 阿里云 DashScope（Qwen LLM） |
| `BIGMODEL_API_KEY` | — | **必填** — BigModel / ZhipuAI（GLM-OCR + GLM-5） |
| `ZAI_API_KEY` | — | **必填** — 网页界面 BigModel 密钥（与 `BIGMODEL_API_KEY` 值相同） |
| `ZAI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | BigModel API 基础 URL |
| `LLM_MODEL` | `qwen3.5-plus` | LLM 模型 — 可自由切换 |
| `DEFAULT_MODE` | `raw` | 默认模式（`raw` / `rag`） |
| `NEXT_PUBLIC_API_BASE` | `http://localhost:5000` | 网页界面 → 后端 URL |

> **独立开发说明：** 使用 `npm run dev` 而非 Docker 时，需将根目录 `.env` 复制到 `FrauGuard/.env`：`cp .env FrauGuard/.env`。使用 Docker Compose 时，所有变量会自动注入。

---

## 运行测试

```bash
cd backend
pytest tests/ -v
```

---

## 许可证

本项目为 VTC 毕业项目之学术研究原型。
