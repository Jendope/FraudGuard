from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
from dotenv import load_dotenv
import json
import logging
from typing import List

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# OCR → LLM pipeline imports (new modules)
# ---------------------------------------------------------------------------
import sys
sys.path.insert(0, os.path.dirname(__file__))

from config import DEFAULT_MODE, OCR_MODEL, LLM_MODEL, EMBED_MODEL, RAG_TOP_K
from config import WHISPER_MODEL, WHISPER_LANGUAGE, WHISPER_DEVICE

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
_whisper_client = None


def _get_ocr_client():
    global _ocr_client
    if _ocr_client is None:
        from ocr.ocr_client import GLMOCR
        _ocr_client = GLMOCR(model_name=OCR_MODEL)
    return _ocr_client


def _get_llm_client():
    global _llm_client
    if _llm_client is None:
        from llm.llm_factory import get_llm_client
        _llm_client = get_llm_client(LLM_MODEL)
    return _llm_client


def _get_rag_client():
    global _rag_client
    if _rag_client is None:
        from llm.rag_client import RAGClient
        _rag_client = RAGClient(embed_model=EMBED_MODEL)
    return _rag_client


def _get_whisper_client():
    global _whisper_client
    if _whisper_client is None:
        from whisper.whisper_client import WhisperClient
        _whisper_client = WhisperClient(
            model_name=WHISPER_MODEL,
            device=WHISPER_DEVICE,
            language=WHISPER_LANGUAGE,
        )
    return _whisper_client

# ============================================
# Configuration
# ============================================
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
# Allow the ChromaDB path to be overridden via env var for Docker deployments.
_default_chroma_path = os.path.join(os.path.dirname(__file__), "..", "rag-pipeline", "chroma_hk01_scam_db")
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", _default_chroma_path)

if not DASHSCOPE_API_KEY:
    raise ValueError("Please set DASHSCOPE_API_KEY in .env file")


# ============================================
# Fraud Detection Components (lazy-loaded)
# ============================================
class LocalEmbeddings:
    def __init__(self, model_name="shibing624/text2vec-base-chinese"):
        from sentence_transformers import SentenceTransformer
        print("Loading embedding model: " + model_name + "...")
        self.model = SentenceTransformer(model_name)
        print("Embedding model loaded successfully!")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode(texts, normalize_embeddings=True).tolist()

    def embed_query(self, text: str) -> List[float]:
        return self.model.encode([text], normalize_embeddings=True)[0].tolist()


# Prompt template (stateless — no model loading required)
_PROMPT_TEMPLATE = """
You are an anti-fraud expert. Based on the following message content and recent real fraud news cases,
determine whether this message matches a known fraud pattern.

Message content:
{sms}

Related recent fraud news (from HK01):
{retrieved_cases}

Please focus on analyzing:
- Whether it involves the same tactics (such as "verify identity", "urgent transfer", "winning a prize", etc.)
- Whether it impersonates official organizations (banks, police, couriers)
- Whether it induces clicking links / downloading apps / providing verification codes

Please output strictly in the following JSON format (no other text):
{{"score": integer (0-10), "reason": "brief reason (within 100 characters)"}}
"""

# Lazy singletons for fraud detection — heavy models loaded on first request
_fraud_embeddings = None
_fraud_vectorstore = None
_fraud_retriever = None
_fraud_llm = None
_fraud_prompt = None


def _get_fraud_embeddings():
    global _fraud_embeddings
    if _fraud_embeddings is None:
        _fraud_embeddings = LocalEmbeddings()
    return _fraud_embeddings


def _get_fraud_vectorstore():
    global _fraud_vectorstore
    if _fraud_vectorstore is None:
        from langchain_community.vectorstores import Chroma
        print("Loading ChromaDB vector store...")
        _fraud_vectorstore = Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=_get_fraud_embeddings()
        )
        print("Vector store loaded with " + str(_fraud_vectorstore._collection.count()) + " documents")
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
            model="deepseek-v3.2",
            openai_api_key=DASHSCOPE_API_KEY,
            openai_api_base="https://dashscope.aliyuncs.com/compatible-mode/v1",
            temperature=0.0
        )
    return _fraud_llm


def _get_fraud_prompt():
    global _fraud_prompt
    if _fraud_prompt is None:
        from langchain_core.prompts import ChatPromptTemplate
        _fraud_prompt = ChatPromptTemplate.from_template(_PROMPT_TEMPLATE)
    return _fraud_prompt


# ============================================
# Fraud Detection Function
# ============================================
def predict_fraud_probability(sms_text: str) -> tuple:
    """
    Predict fraud probability using RAG + LLM

    Returns:
        tuple: (probability: float, reason: str)
    """
    try:
        # Retrieve similar fraud cases
        retrieved_docs = _get_fraud_retriever().invoke(sms_text)
        cases = "\n".join([doc.page_content[:500] for doc in retrieved_docs])

        # Format prompt and get LLM response
        formatted_prompt = _get_fraud_prompt().format(sms=sms_text, retrieved_cases=cases)
        response = _get_fraud_llm().invoke(formatted_prompt)
        output = response.content.strip()

        # Parse JSON response
        try:
            result = json.loads(output)
            score = int(result["score"])
            reason = result.get("reason", "No reason provided").strip()
            score = max(0, min(10, score))  # Clamp to 0-10
            probability = score / 10.0
            return probability, reason
        except Exception:
            # Fallback: extract numbers and text
            numbers = re.findall(r'\d+', output)
            score = int(numbers[0]) if numbers else 5
            score = max(0, min(10, score))
            probability = score / 10.0

            # Extract reason
            reason_match = re.search(r'(?<=[:"\uff1a])([^"\\]+?)(?="|$)', output)
            if reason_match:
                reason = reason_match.group(1).strip()[:100]
            else:
                reason = "(System response: " + output[:50] + "...)"

            return probability, reason

    except Exception as e:
        print("Error in prediction: " + str(e))
        return 0.5, "Analysis error: " + str(e)


# ============================================
# API Routes
# ============================================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Return the document count only when the vectorstore is already
    # initialised to keep the health check fast on cold starts.
    doc_count = (
        _fraud_vectorstore._collection.count()
        if _fraud_vectorstore is not None
        else None
    )
    return jsonify({
        'status': 'healthy',
        'model': 'deepseek-v3.2',
        'documents': doc_count,
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze text for fraud probability

    Request body:
        {
            "text": "string - the suspicious message to analyze"
        }

    Response:
        {
            "probability": float (0.0 to 1.0),
            "reason": "string - explanation",
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

        # Perform fraud detection
        probability, reason = predict_fraud_probability(text)

        return jsonify({
            'success': True,
            'probability': probability,
            'reason': reason,
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
# Whisper Speech-to-Text Endpoint
# ============================================

# Allowed audio MIME type prefixes for the /transcribe endpoint.
_AUDIO_MIME_PREFIXES = ("audio/", "video/")
# Allowed file extensions (without leading dot).
_AUDIO_EXTENSIONS = {
    "mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg", "flac",
}


@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Whisper speech-to-text endpoint.

    Accepts multipart/form-data:
        file     — audio file (required; any ffmpeg-decodable format)
        language — ISO-639-1 language code override, e.g. "en" (optional)
        analyze  — "true" | "false" (optional).  When "true" the transcribed
                   text is also passed through the fraud-detection pipeline
                   so the caller gets both transcription and a fraud score in
                   a single request.

    Returns JSON:
        {
          "text":        str,           // full transcription
          "language":    str,           // detected/forced language
          "segments":    list[dict],    // per-segment {start, end, text}
          "meta":        dict,          // provenance info
          "fraud":       dict | null    // present only when analyze=true
        }
    """
    # ---- 1. Validate file upload -----------------------------------------
    if 'file' not in request.files:
        return jsonify({"error": "No 'file' field in request"}), 400

    uploaded_file = request.files['file']
    if not uploaded_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    # ---- 2. Derive file extension ----------------------------------------
    filename = uploaded_file.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    mime = uploaded_file.mimetype or ""

    # Reject obvious non-audio uploads (best-effort; ffmpeg will catch the rest).
    is_audio_mime = any(mime.startswith(p) for p in _AUDIO_MIME_PREFIXES)
    is_audio_ext = ext in _AUDIO_EXTENSIONS
    if mime and not is_audio_mime and not is_audio_ext:
        return jsonify({
            "error": (
                f"Unsupported file type '{mime}'. "
                "Please upload an audio file (wav, mp3, m4a, webm, etc.)."
            )
        }), 400

    # ---- 3. Optional per-request language override ----------------------
    lang_override = request.form.get("language", "").strip() or None

    # ---- 4. Read audio bytes -------------------------------------------
    try:
        audio_bytes = uploaded_file.read()
        if not audio_bytes:
            return jsonify({"error": "Uploaded file is empty"}), 400
    except Exception as exc:
        return jsonify({"error": f"Could not read uploaded file: {exc}"}), 400

    # ---- 5. Transcribe --------------------------------------------------
    try:
        whisper_client = _get_whisper_client()
        transcription = whisper_client.transcribe(
            audio_bytes,
            file_ext=ext,
            language=lang_override,
        )
    except Exception as exc:
        logger.error("Whisper transcription failed: %s", exc)
        return jsonify({"error": f"Transcription failed: {exc}"}), 500

    # ---- 6. Optional fraud analysis ------------------------------------
    fraud_result = None
    analyze = request.form.get("analyze", "false").strip().lower() == "true"
    if analyze:
        text = transcription.get("text", "").strip()
        if text:
            try:
                probability, reason = predict_fraud_probability(text)
                fraud_result = {
                    "probability": probability,
                    "reason": reason,
                }
            except Exception as exc:
                logger.error("Fraud analysis failed after transcription: %s", exc)
                fraud_result = {"error": str(exc)}

    # ---- 7. Return structured response ---------------------------------
    return jsonify({
        "text": transcription["text"],
        "language": transcription["language"],
        "segments": transcription["segments"],
        "meta": transcription["meta"],
        "fraud": fraud_result,
    })


# ============================================
# Run Server
# ============================================
if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("HK FraudGuard Backend Server")
    print("=" * 50)
    print("Fraud detection models will load on first request")
    print("Using model: deepseek-v3.2")
    print("Server starting on http://localhost:5000")
    print("=" * 50 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
