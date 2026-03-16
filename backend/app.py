if os.getenv("RENDER", False) or os.getenv("PORT"):
    CHROMA_DB_PATH = "/tmp/chroma_hk01_scam_db"

import json
import logging
import os
import re
import sys
import warnings
from typing import List

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Suppress the Pydantic V1 deprecation warning emitted by langchain-core on
# Python 3.14+.  langchain-core still imports ``pydantic.v1`` for backward
# compatibility, which triggers a UserWarning in ``pydantic>=2.11``.  This is
# a known upstream issue and safe to silence until langchain-core drops V1.
# ---------------------------------------------------------------------------
warnings.filterwarnings(
    "ignore",
    message=r".*Pydantic V1.*",
    category=UserWarning,
    module=r"pydantic\..*",
)

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# OCR → LLM pipeline imports (new modules)
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(__file__))

from config import (  # noqa: E402
    DASHSCOPE_API_KEY,
    DEFAULT_MODE,
    EMBED_MODEL,
    LLM_MODEL,
    OCR_MODEL,
    RAG_TOP_K,
)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-loaded singletons for OCR / LLM / RAG — instantiated on first request
# so the server starts quickly even without GPU/large models.
# ---------------------------------------------------------------------------
_ocr_client = None
_llm_client = None
_rag_client = None


def _get_ocr_client():
    global _ocr_client
    if _ocr_client is None:
        from modules.ocr_factory import get_ocr_client
        _ocr_client = get_ocr_client(OCR_MODEL)
    return _ocr_client


def _get_llm_client():
    global _llm_client
    if _llm_client is None:
        from modules.llm_factory import get_llm_client
        _llm_client = get_llm_client(LLM_MODEL)
    return _llm_client


def _get_rag_client():
    global _rag_client
    if _rag_client is None:
        from modules.rag_client import RAGClient
        _rag_client = RAGClient(embed_model=EMBED_MODEL)
    return _rag_client


# ============================================
# Configuration
# ============================================
# Allow the ChromaDB path to be overridden via env var for Docker deployments.
_default_chroma_path = os.path.join(os.path.dirname(__file__), "chroma_hk01_scam_db")
if os.getenv("RENDER") or os.getenv("PORT"):
    CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "/tmp/chroma_hk01_scam_db")
else:
    CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", _default_chroma_path)

if not DASHSCOPE_API_KEY:
    raise ValueError("Please set DASHSCOPE_API_KEY in .env file")


# ============================================
# Fraud Detection Components (lazy-loaded)
# ============================================
class LocalEmbeddings:
    def __init__(self, model_name="BAAI/bge-large-zh-v1.5"):
        from sentence_transformers import SentenceTransformer
        print("Loading embedding model: " + model_name + "...")
        self.model = SentenceTransformer(model_name)
        print("Embedding model loaded successfully!")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode(texts, normalize_embeddings=True).tolist()

    def embed_query(self, text: str) -> List[float]:
        return self.model.encode([text], normalize_embeddings=True)[0].tolist()


# Prompt templates in three languages (stateless — no model loading required)
_PROMPT_TEMPLATES = {
    "en": """
You are an anti-fraud expert. Based on the following message content and recent real fraud news cases,
determine whether this message matches a known fraud pattern.

Message content:
{sms}

Related recent fraud news (from HK01):
{retrieved_cases}

内部分析要点（保持中文分析逻辑）：
- 是否涉及相同手法（如"验证身份"、"紧急转账"、"中奖"、"假冒官方"等）
- 是否模仿官方机构（银行、公安、快递）
- 是否诱导点击链接/下载APP/提供验证码/拨打陌生电话
- 是否符合常见诈骗特征如：诱惑性高回报/制造紧急恐慌/非接触式联络/要求资金转账

Please output strictly in the following JSON format (no other text).
The "prevention_advice" and "warning_message" fields must be written in English.
{{
  "score": <integer 0-10, where 0 is definitely safe and 10 is definitely a scam>,
  "reason": "<brief reason within 100 characters>",
  "scam_tactics": ["<tactic 1>", "<tactic 2>"],
  "prevention_advice": "<actionable advice to avoid this scam, in English>",
  "warning_message": "<clear warning message for the user, in English>"
}}
""",
    "zh-cn": """
你是一名反诈专家。请根据以下用户描述和近期真实诈骗新闻片段，判断用户描述的是否属于已知诈骗模式。

用户描述：
{sms}

相关近期诈骗新闻片段（来自 HK01）：
{retrieved_cases}

请重点分析：
- 是否涉及相同手法（如"验证身份"、"紧急转账"、"中奖"等）
- 是否模仿官方机构（银行、公安、快递）
- 是否诱导点击链接/下载APP/提供验证码/拨打陌生电话
- 是否符合常见诈骗特征如：诱惑性高回报/制造紧急恐慌/非接触式联络/要求资金转账/提供第三方链接

请严格按照以下 JSON 格式输出（不要任何其他文字）。
"prevention_advice" 和 "warning_message" 字段必须使用简体中文。
{{
  "score": <整数（0-10）>,
  "reason": "<简要理由（50字内）>",
  "scam_tactics": ["<手法1>", "<手法2>"],
  "prevention_advice": "<用简体中文给出可操作的防骗建议>",
  "warning_message": "<用简体中文给出明确的警示信息>"
}}
""",
    "zh-tw": """
你是一名反詐專家。請根據以下用戶描述和近期真實詐騙新聞片段，判斷用戶描述的是否屬於已知詐騙模式。

用戶描述：
{sms}

相關近期詐騙新聞片段（來自 HK01）：
{retrieved_cases}

請重點分析：
- 是否涉及相同手法（如「驗證身份」、「緊急轉帳」、「中獎」等）
- 是否模仿官方機構（銀行、公安、快遞）
- 是否誘導點擊連結/下載APP/提供驗證碼/撥打陌生電話
- 是否符合常見詐騙特徵如：誘惑性高回報/製造緊急恐慌/非接觸式聯絡/要求資金轉帳/提供第三方連結

請嚴格按照以下 JSON 格式輸出（不要任何其他文字）。
"prevention_advice" 和 "warning_message" 欄位必須使用繁體中文。
{{
  "score": <整數（0-10）>,
  "reason": "<簡要理由（50字內）>",
  "scam_tactics": ["<手法1>", "<手法2>"],
  "prevention_advice": "<用繁體中文給出可操作的防騙建議>",
  "warning_message": "<用繁體中文給出明確的警示訊息>"
}}
""",
}

SUPPORTED_LANGUAGES = list(_PROMPT_TEMPLATES.keys())
DEFAULT_LANGUAGE = "zh-cn"  # 自动检测失败时的默认语言


def _detect_language(text: str) -> str:
    """
    自动检测文本语言，映射到支持的语言代码。
    如果检测失败或结果不在支持列表中，默认返回中文（zh-cn）。
    """
    try:
        from langdetect import detect
        lang = detect(text)
        # 映射 langdetect 输出到支持的语言代码
        if lang == "zh-tw":
            return "zh-tw"
        if lang in ("zh-cn", "zh"):
            return "zh-cn"
        if lang == "en":
            return "en"
        # 其他语言默认使用中文分析
        return "zh-cn"
    except Exception:
        return "zh-cn"

# Lazy singletons for fraud detection — heavy models loaded on first request
_fraud_embeddings = None
_fraud_vectorstore = None
_fraud_retriever = None
_fraud_llm = None


def _get_fraud_embeddings():
    global _fraud_embeddings
    if _fraud_embeddings is None:
        _fraud_embeddings = LocalEmbeddings()
    return _fraud_embeddings


def _get_fraud_vectorstore():
    global _fraud_vectorstore
    if _fraud_vectorstore is None:
        from langchain_chroma import Chroma
        from langchain_core.documents import Document

        if os.path.exists(CHROMA_DB_PATH):
            print("Loading ChromaDB vector store...")
            _fraud_vectorstore = Chroma(
                persist_directory=CHROMA_DB_PATH,
                embedding_function=_get_fraud_embeddings(),
                collection_metadata={"hnsw:space": "cosine"},
            )
            print("Vector store loaded with " + str(_fraud_vectorstore._collection.count()) + " documents")
        else:
            # Build vector store from the markdown data file
            file_path = os.path.join(os.path.dirname(__file__), "hk01_scam_articles.md")
            if not os.path.exists(file_path):
                raise FileNotFoundError(
                    f"Data file {file_path} not found. "
                    "Please ensure hk01_scam_articles.md exists in the backend directory."
                )

            print("Building ChromaDB vector store from " + file_path + " ...")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            articles = [a.strip() for a in re.split(r'\n-{3,}\n', content) if a.strip()]
            print(f"Loaded {len(articles)} scam news articles")

            docs = []
            for i, art in enumerate(articles):
                lines = art.split('\n')
                title_line = lines[0].strip() if lines else ""
                if not title_line:
                    continue
                title_match = re.search(r'\[(.*?)\]', title_line)
                title = title_match.group(1) if title_match else title_line.replace('##', '').strip()
                url_match = re.search(r'https?://[^\s\)]+', title_line)
                url = url_match.group(0) if url_match else ""
                body_lines = lines[1:]
                body_text = '\n'.join(body_lines)
                paragraphs = [p.strip() for p in body_text.split('\n\n') if p.strip()]
                for j, para in enumerate(paragraphs):
                    doc = Document(
                        page_content=para,
                        metadata={
                            "source": file_path,
                            "article_id": i + 1,
                            "paragraph_id": j + 1,
                            "title": title,
                            "url": url,
                        },
                    )
                    docs.append(doc)

            print(f"Generated {len(docs)} paragraph documents")
            _fraud_vectorstore = Chroma.from_documents(
                docs,
                _get_fraud_embeddings(),
                persist_directory=CHROMA_DB_PATH,
                collection_metadata={"hnsw:space": "cosine"},
            )
            print("Vector store built with " + str(_fraud_vectorstore._collection.count()) + " documents")
    return _fraud_vectorstore


def _get_fraud_retriever():
    global _fraud_retriever
    if _fraud_retriever is None:
        _fraud_retriever = _get_fraud_vectorstore().as_retriever(search_kwargs={"k": 3})
    return _fraud_retriever


def _get_fraud_llm():
    global _fraud_llm
    if _fraud_llm is None:
        from langchain_openai import ChatOpenAI
        _fraud_llm = ChatOpenAI(
            model=LLM_MODEL,
            openai_api_key=DASHSCOPE_API_KEY,
            openai_api_base="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
            temperature=0.0
        )
    return _fraud_llm


def _get_fraud_prompt(language: str = DEFAULT_LANGUAGE):
    from langchain_core.prompts import ChatPromptTemplate
    template = _PROMPT_TEMPLATES.get(language, _PROMPT_TEMPLATES[DEFAULT_LANGUAGE])
    return ChatPromptTemplate.from_template(template)


# ============================================
# Fraud Detection Function
# ============================================
def predict_fraud_probability(sms_text: str, language: str = None, language_override: str = None) -> dict:
    """
    Predict fraud probability using RAG + LLM

    Parameters:
        sms_text: The suspicious message text to analyze
        language: Prompt language — "en", "zh-cn", or "zh-tw". If None, auto-detected.
        language_override: Explicit language override, takes precedence over auto-detection.

    Returns:
        dict with keys: probability (float), reason (str), scam_tactics (list),
                        prevention_advice (str), warning_message (str), language (str)
    """
    # language_override 优先级最高；其次是显式传入的 language；最后自动检测
    if language_override and language_override in SUPPORTED_LANGUAGES:
        effective_language = language_override
    elif language and language in SUPPORTED_LANGUAGES:
        effective_language = language
    else:
        # 自动检测用户输入语言，如检测失败则默认中文
        effective_language = _detect_language(sms_text)

    try:
        # 检索相似诈骗案例
        retrieved_docs = _get_fraud_retriever().invoke(sms_text)
        cases = "\n".join([doc.page_content[:500] for doc in retrieved_docs])

        # 使用检测到的语言格式化提示词，调用 LLM
        prompt = _get_fraud_prompt(effective_language)
        formatted_prompt = prompt.format(sms=sms_text, retrieved_cases=cases)
        response = _get_fraud_llm().invoke(formatted_prompt)
        output = response.content.strip()

        # 解析 JSON 响应（新的五字段结构）
        try:
            # 提取 JSON 块（兼容 LLM 可能输出额外文字的情况）
            json_match = re.search(r'\{[\s\S]*\}', output)
            raw_json = json_match.group(0) if json_match else output
            result = json.loads(raw_json)
            score = int(result["score"])
            score = max(0, min(10, score))  # 限制在 0-10 范围内
            probability = score / 10.0
            reason = result.get("reason", "No reason provided").strip()
            scam_tactics = result.get("scam_tactics", [])
            if not isinstance(scam_tactics, list):
                scam_tactics = [str(scam_tactics)]
            prevention_advice = result.get("prevention_advice", "").strip()
            warning_message = result.get("warning_message", "").strip()
            return {
                "probability": probability,
                "reason": reason,
                "scam_tactics": scam_tactics,
                "prevention_advice": prevention_advice,
                "warning_message": warning_message,
                "language": effective_language,
            }
        except Exception:
            # 降级：使用正则提取数字和文本（兼容旧格式输出）
            numbers = re.findall(r'\d+', output)
            score = int(numbers[0]) if numbers else 5
            score = max(0, min(10, score))
            probability = score / 10.0

            # 提取 reason 字段
            reason_match = re.search(r'(?<=[:"\uff1a])([^"\\]+?)(?="|$)', output)
            if reason_match:
                reason = reason_match.group(1).strip()[:100]
            else:
                reason = "(System response: " + output[:50] + "...)"

            return {
                "probability": probability,
                "reason": reason,
                "scam_tactics": [],
                "prevention_advice": "",
                "warning_message": "",
                "language": effective_language,
            }

    except Exception as e:
        print("Error in prediction: " + str(e))
        return {
            "probability": 0.5,
            "reason": "Analysis error: " + str(e),
            "scam_tactics": [],
            "prevention_advice": "",
            "warning_message": "",
            "language": effective_language,
        }


# ============================================
# OCR Preprocessing Helper
# ============================================
def preprocess_ocr(image_bytes: bytes | None) -> str:
    """
    对图像执行OCR预处理，根据 OCR_MODEL 配置自动选择OCR引擎。

    Parameters:
        image_bytes: 图像原始字节数据；如果为 None 则直接返回空字符串。

    Returns:
        str: 从图像中提取的文本；如果 OCR 失败则降级为空字符串（纯文本模式）。
    """
    if image_bytes is None:
        return ""
    try:
        ocr_client = _get_ocr_client()
        result = ocr_client.extract_text(image_bytes)
        return result.get("text", "")
    except Exception as e:
        print("OCR预处理失败，降级为纯文本模式: " + str(e))
        return ""


# ============================================
# API Routes
# ============================================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Return the document count only when the vectorstore is already
    # initialised to keep the health check fast on cold starts.
    logger.info(f"Health check: CHROMA_DB_PATH={CHROMA_DB_PATH}, exists={os.path.exists(CHROMA_DB_PATH)}")

    doc_count = (
        _fraud_vectorstore._collection.count()
        if _fraud_vectorstore is not None
        else None
    )
    return jsonify({
        'status': 'healthy',
        'model': LLM_MODEL,
        'documents': doc_count,
        'supported_languages': SUPPORTED_LANGUAGES,
        'chroma_path': CHROMA_DB_PATH,
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze text for fraud probability

    Request body:
        {
            "text": "string - the suspicious message to analyze",
            "language": "string - prompt language: en, zh-cn, zh-tw (optional, auto-detected if omitted)"
        }

    Response:
        {
            "probability": float (0.0 to 1.0),
            "reason": "string - brief explanation",
            "scam_tactics": ["string"] - identified scam tactics,
            "prevention_advice": "string - actionable prevention advice in user's language",
            "warning_message": "string - clear warning in user's language",
            "language": "string - language used",
            "success": boolean
        }
    """
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing "text" field in request body'
            }), 400

        text = data['text'].strip()

        if not text:
            return jsonify({
                'success': False,
                'error': 'Text cannot be empty'
            }), 400

        # language 为可选参数；不传时自动检测
        language = data.get('language', None)
        if language is not None:
            language = language.strip().lower()
            if language not in SUPPORTED_LANGUAGES:
                return jsonify({
                    'success': False,
                    'error': f"Unsupported language '{language}'. Use one of: {SUPPORTED_LANGUAGES}"
                }), 400

        # 执行诈骗检测（返回包含五个字段的字典）
        result = predict_fraud_probability(text, language=language)

        return jsonify({
            'success': True,
            'probability': result['probability'],
            'reason': result['reason'],
            'scam_tactics': result['scam_tactics'],
            'prevention_advice': result['prevention_advice'],
            'warning_message': result['warning_message'],
            'language': result['language'],
            'input_length': len(text)
        })

    except Exception as e:
        print("API Error: " + str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================
# OCR → LLM Pipeline Endpoint  (new)
# ============================================

@app.route('/process', methods=['POST'])
def process():
    """
    OCR → LLM pipeline endpoint.

    Accepts multipart/form-data:
        file   — image file (required)
        mode   — "raw" or "rag" (optional, falls back to DEFAULT_MODE env var)
        prompt — additional user instructions (optional)

    Returns JSON:
        {
          "mode":        "raw" | "rag",
          "ocr_text":   str,
          "retrieved":  list[str] | null,
          "llm_output": str,
          "provenance": dict
        }

    Toggle logic
    ------------
    mode = request.form.get("mode", DEFAULT_MODE)
    if mode == "rag":
        # embed OCR text, retrieve top-k passages, prepend as context
    else:
        # send OCR text + prompt directly to the LLM
    """
    # ---- 1. Validate file upload -----------------------------------------
    if 'file' not in request.files:
        return jsonify({"error": "No 'file' field in request"}), 400

    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    # ---- 2. Read mode and optional prompt --------------------------------
    mode = request.form.get("mode", DEFAULT_MODE).strip().lower()
    if mode not in ("raw", "rag"):
        return jsonify({"error": f"Invalid mode '{mode}'. Use 'raw' or 'rag'."}), 400

    user_prompt = request.form.get("prompt", "").strip()

    try:
        image_bytes = uploaded_file.read()
        if not image_bytes:
            return jsonify({"error": "Uploaded file is empty"}), 400
    except Exception as exc:
        return jsonify({"error": f"Could not read uploaded file: {exc}"}), 400

    # ---- 3. OCR -----------------------------------------------------------
    try:
        ocr_result = _get_ocr_client().extract_text(image_bytes)
        ocr_text = ocr_result["text"]
        ocr_meta = ocr_result.get("meta", {})
    except Exception as exc:
        logger.error("OCR failed: %s", exc)
        return jsonify({"error": f"OCR failed: {exc}"}), 500

    # ---- 4. Toggle: Raw LLM vs RAG ---------------------------------------
    retrieved_passages: list = []
    provenance: dict = {"mode": mode, "ocr_model": ocr_meta.get("model", OCR_MODEL)}

    if mode == "rag":
        # 4a. Index the OCR output, then retrieve relevant passages.
        rag = _get_rag_client()
        rag.index_documents([ocr_text])

        query = user_prompt if user_prompt else ocr_text
        retrieved_passages, context = rag.build_context(query, top_k=RAG_TOP_K)

        provenance["chunk_count"] = len(rag._chunks)
        provenance["retrieved_count"] = len(retrieved_passages)

        full_prompt = (
            f"Context passages (retrieved from OCR output):\n{context}\n\n"
            f"OCR extracted text:\n{ocr_text}\n\n"
        )
        if user_prompt:
            full_prompt += f"User instruction:\n{user_prompt}\n\n"
        full_prompt += "Please answer based on the context and extracted text above."

    else:
        # 4b. Raw LLM — send OCR text (and optional prompt) directly.
        full_prompt = f"Extracted text from image:\n{ocr_text}\n\n"
        if user_prompt:
            full_prompt += f"User instruction:\n{user_prompt}\n\n"
        full_prompt += "Please respond to the above."

    # ---- 5. LLM call ------------------------------------------------------
    try:
        llm_output = _get_llm_client().ask(full_prompt)
    except Exception as exc:
        logger.error("LLM call failed: %s", exc)
        return jsonify({"error": f"LLM failed: {exc}"}), 500

    # ---- 6. Return structured response -----------------------------------
    return jsonify({
        "mode": mode,
        "ocr_text": ocr_text,
        "retrieved": retrieved_passages if mode == "rag" else None,
        "llm_output": llm_output,
        "provenance": provenance,
    })


# ============================================
# Run Server
# ============================================
if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("HK FraudGuard Backend Server")
    print("=" * 50)
    print("Fraud detection models will load on first request")
    print(f"Using LLM: {LLM_MODEL}")
    print("Server starting on http://localhost:5000")
    print("=" * 50 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
