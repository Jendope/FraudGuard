/**
 * i18n.jsx — Trilingual support for HK FraudGuard.
 *
 * Combines the language context provider, translation strings, and
 * the useLanguage hook in a single module for simpler maintenance.
 *
 * Supported languages:
 *   - English             (en)
 *   - Traditional Chinese (zh-hant) — for Hong Kong users
 *   - Simplified Chinese  (zh-hans) — for Mainland China users
 *
 * Language preference is persisted in localStorage so it survives
 * page reloads.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ─── Translations ──────────────────────────────────────────────────────────────

const translations = {
  // ─── English ───────────────────────────────────────────────────────
  en: {
    // Language toggle
    lang_en: 'EN',
    lang_zhHant: '繁',
    lang_zhHans: '简',

    // LandingPage
    landing_badge: '🛡️ HK FraudGuard — Fraud Detection with AI',
    landing_heading_prefix: 'HK FraudGuard — Detect Fraud with ',
    landing_heading_highlight: 'AI + RAG',
    landing_tagline:
      'Upload a suspicious document or message. Our AI pipeline extracts text, cross-references 606 verified Hong Kong fraud cases, and returns a clear fraud-risk assessment.',
    landing_try_demo: '🚀 Try Demo',
    landing_mode_llm: '⚡ LLM — Fast direct analysis',
    landing_mode_rag: '📖 LLM + RAG — Context-aware analysis',
    landing_feature_ocr_title: 'OCR Extraction',
    landing_feature_ocr_desc:
      'Automatically reads text from uploaded images using GLM-OCR.',
    landing_feature_llm_title: 'LLM Analysis',
    landing_feature_llm_desc:
      'DeepSeek LLM analyses extracted text for fraud indicators.',
    landing_feature_rag_title: 'RAG Context',
    landing_feature_rag_desc:
      '606 real HK fraud cases retrieved to enrich analysis accuracy.',
    landing_footer: 'Built by VTC Students · HK01 Knowledge Base · DeepSeek LLM',

    // OnboardingTutorial
    tutorial_skip: 'Skip Tutorial',
    tutorial_back: '← Back',
    tutorial_next: 'Next →',
    tutorial_start_demo: '🚀 Start Demo',
    tutorial_step1_title: 'Welcome to HK FraudGuard',
    tutorial_step1_p1:
      'This tool helps you check whether a message, letter, or document might be a scam or fraud.',
    tutorial_step1_p2:
      'Many scammers in Hong Kong send fake messages pretending to be banks, government offices, or delivery companies. This app can help you identify them quickly.',
    tutorial_step2_title: 'Step 1 — Take a Photo',
    tutorial_step2_p1:
      'If you received a suspicious message on paper or on your screen, take a clear photo of it.',
    tutorial_step2_p2:
      'Make sure the text in the photo is easy to read — good lighting and a steady hand will help.',
    tutorial_step2_tip:
      'Tip: You can also take a screenshot on your phone and use that image.',
    tutorial_step3_title: 'Step 2 — Upload the Image',
    tutorial_step3_p1:
      'On the next screen, press the large button labelled "Choose Image File" and select the photo you just took.',
    tutorial_step3_p2:
      'The app will automatically read all the text from your image — you do not need to type anything.',
    tutorial_step4_title: 'Step 3 — Choose an Analysis Mode',
    tutorial_step4_intro: 'You will see two options:',
    tutorial_step4_llm:
      'LLM — Fast check using Artificial Intelligence. Good for a quick answer.',
    tutorial_step4_rag:
      'LLM + RAG — Deeper check that also searches through hundreds of real Hong Kong fraud cases for comparison. More thorough.',
    tutorial_step4_recommend:
      'If you are unsure, choose LLM + RAG for the most accurate result.',
    tutorial_step5_title: 'Step 4 — Read the Result',
    tutorial_step5_intro: 'After pressing "Process", the app will show you:',
    tutorial_step5_item1: 'The text it read from your image',
    tutorial_step5_item2: 'A fraud risk assessment from the AI',
    tutorial_step5_item3: 'Relevant past fraud cases (in LLM + RAG mode)',
    tutorial_step5_warning:
      'If the result says the message looks suspicious, do not reply to it or click any links. Contact the Hong Kong Police Force at 999 or the Anti-Scam Helpline at 18222.',
    tutorial_step6_title: "You're Ready!",
    tutorial_step6_p1:
      'You now know how to use HK FraudGuard. Press Start Demo below to try it yourself.',
    tutorial_step6_p2:
      'Remember — if you ever feel unsure about a message you have received, use this app to check it. It is free and takes less than a minute.',
    tutorial_step6_safety:
      'Stay safe online. Legitimate banks and government offices will never ask for your password or full ID number over phone or message.',

    // App (Demo view)
    demo_back_home: '← Back to Home',
    demo_heading: 'HK FraudGuard Demo',
    demo_description:
      'Analyse suspicious messages using OCR or speech-to-text, then process with LLM or LLM + RAG.',
    demo_tab_image: '🖼 Image (OCR)',
    demo_tab_audio: '🎙 Audio (Whisper STT)',
    demo_audio_desc:
      'Upload or record audio to transcribe it with OpenAI Whisper. Optionally run fraud detection on the transcribed text.',
    demo_results: 'Results',
    demo_mode_label: 'mode:',
    demo_ocr_text: 'OCR Extracted Text',
    demo_retrieved: 'Retrieved Passages (RAG)',
    demo_llm_output: 'LLM Output',
    demo_provenance: 'Provenance',
    demo_error: 'Error:',
    demo_empty: '(empty)',
    demo_transcription: 'Transcription',
    demo_language_label: 'language:',
    demo_transcribed_text: 'Transcribed Text',
    demo_segments: 'Segments',
    demo_fraud_analysis: 'Fraud Analysis',
    demo_fraud_probability: 'Fraud Probability:',
    demo_fraud_reason: 'Reason:',
    demo_meta: 'Meta',

    // ToggleMode
    toggle_legend: 'Processing Mode',
    toggle_raw: 'Raw LLM',
    toggle_rag: 'LLM + RAG',

    // UploadForm
    upload_image_label: 'Image File',
    upload_prompt_label: 'Optional Prompt',
    upload_prompt_placeholder: 'e.g. Summarise the key points in the document',
    upload_selected: 'Selected:',
    upload_error_type: 'Please select a valid image file (PNG, JPEG, etc.).',
    upload_error_size: 'File is too large. Maximum allowed size is {size} MB.',
    upload_error_required: 'Please select an image file first.',
    upload_processing: 'Processing…',
    upload_process_raw: 'Process (Raw LLM)',
    upload_process_rag: 'Process (LLM+RAG)',

    // AudioUpload
    audio_file_label: 'Audio File',
    audio_selected: 'Selected:',
    audio_error_type:
      'Please select a valid audio file (wav, mp3, m4a, webm, etc.).',
    audio_start_recording: '🎙 Start Recording',
    audio_stop_recording: '⏹ Stop Recording',
    audio_mic_denied: 'Microphone access denied:',
    audio_language_label: 'Language Hint',
    audio_language_optional: '(optional, e.g. en, zh, ja)',
    audio_language_placeholder: 'auto-detect',
    audio_analyze_label: 'Also analyse transcription for fraud',
    audio_error_required: 'Please select or record an audio file first.',
    audio_transcribing: 'Transcribing…',
    audio_transcribe: 'Transcribe Audio',
    audio_unknown: 'unknown',
  },

  // ─── Traditional Chinese (繁體中文) ─────────────────────────────────
  'zh-hant': {
    lang_en: 'EN',
    lang_zhHant: '繁',
    lang_zhHans: '简',

    landing_badge: '🛡️ HK FraudGuard — AI 詐騙檢測',
    landing_heading_prefix: 'HK FraudGuard — 以 ',
    landing_heading_highlight: 'AI + RAG',
    landing_tagline:
      '上傳可疑文件或訊息，我們的 AI 系統將自動擷取文字、比對 606 宗經證實的香港詐騙案例，並提供清晰的詐騙風險評估。',
    landing_try_demo: '🚀 立即試用',
    landing_mode_llm: '⚡ LLM — 快速直接分析',
    landing_mode_rag: '📖 LLM + RAG — 情境感知分析',
    landing_feature_ocr_title: 'OCR 文字擷取',
    landing_feature_ocr_desc: '使用 GLM-OCR 自動從上傳圖片中讀取文字。',
    landing_feature_llm_title: 'LLM 分析',
    landing_feature_llm_desc: 'DeepSeek LLM 分析擷取的文字以識別詐騙指標。',
    landing_feature_rag_title: 'RAG 情境檢索',
    landing_feature_rag_desc: '檢索 606 宗真實香港詐騙案例以提高分析準確度。',
    landing_footer: '由 VTC 學生團隊製作 · HK01 知識庫 · DeepSeek LLM',

    tutorial_skip: '跳過教學',
    tutorial_back: '← 返回',
    tutorial_next: '下一步 →',
    tutorial_start_demo: '🚀 開始試用',
    tutorial_step1_title: '歡迎使用 HK FraudGuard',
    tutorial_step1_p1:
      '此工具幫助您檢查訊息、信件或文件是否可能是詐騙。',
    tutorial_step1_p2:
      '香港有許多騙徒假扮銀行、政府機構或速遞公司發送虛假訊息。此應用程式能幫助您快速識別它們。',
    tutorial_step2_title: '第一步 — 拍攝照片',
    tutorial_step2_p1:
      '如果您收到紙本或螢幕上的可疑訊息，請拍攝一張清晰的照片。',
    tutorial_step2_p2:
      '確保照片中的文字易於閱讀——良好的光線和穩定的手部會有幫助。',
    tutorial_step2_tip:
      '提示：您也可以在手機上截圖並使用該圖片。',
    tutorial_step3_title: '第二步 — 上傳圖片',
    tutorial_step3_p1:
      '在下一個畫面，按下標示「選擇圖片檔案」的大按鈕，然後選擇您剛拍攝的照片。',
    tutorial_step3_p2:
      '應用程式會自動讀取圖片中的所有文字——您無需輸入任何內容。',
    tutorial_step4_title: '第三步 — 選擇分析模式',
    tutorial_step4_intro: '您會看到兩個選項：',
    tutorial_step4_llm:
      'LLM — 使用人工智能快速檢查。適合快速得到答案。',
    tutorial_step4_rag:
      'LLM + RAG — 更深入的檢查，同時搜尋數百宗真實香港詐騙案例進行比較。更加全面。',
    tutorial_step4_recommend:
      '如果您不確定，請選擇 LLM + RAG 以獲得最準確的結果。',
    tutorial_step5_title: '第四步 — 閱讀結果',
    tutorial_step5_intro: '按下「處理」後，應用程式會顯示：',
    tutorial_step5_item1: '從圖片中讀取的文字',
    tutorial_step5_item2: 'AI 的詐騙風險評估',
    tutorial_step5_item3: '相關的過往詐騙案例（LLM + RAG 模式）',
    tutorial_step5_warning:
      '如果結果顯示訊息可疑，請勿回覆或點擊任何連結。請致電香港警方 999 或防詐騙熱線 18222。',
    tutorial_step6_title: '準備就緒！',
    tutorial_step6_p1:
      '您已了解如何使用 HK FraudGuard。按下「開始試用」即可親自體驗。',
    tutorial_step6_p2:
      '記住——每當您對收到的訊息感到不確定時，都可以使用此應用程式來檢查。它是免費的，只需不到一分鐘。',
    tutorial_step6_safety:
      '注意網絡安全。正規的銀行和政府機構絕不會通過電話或訊息要求您提供密碼或完整的身份證號碼。',

    demo_back_home: '← 返回首頁',
    demo_heading: 'HK FraudGuard 示範',
    demo_description:
      '使用 OCR 或語音轉文字分析可疑訊息，然後透過 LLM 或 LLM + RAG 處理。',
    demo_tab_image: '🖼 圖片 (OCR)',
    demo_tab_audio: '🎙 音訊 (Whisper STT)',
    demo_audio_desc:
      '上傳或錄製音訊，使用 OpenAI Whisper 進行轉錄。可選擇對轉錄文字進行詐騙檢測。',
    demo_results: '結果',
    demo_mode_label: '模式：',
    demo_ocr_text: 'OCR 擷取文字',
    demo_retrieved: '檢索段落 (RAG)',
    demo_llm_output: 'LLM 輸出',
    demo_provenance: '來源資訊',
    demo_error: '錯誤：',
    demo_empty: '（空）',
    demo_transcription: '轉錄結果',
    demo_language_label: '語言：',
    demo_transcribed_text: '轉錄文字',
    demo_segments: '段落',
    demo_fraud_analysis: '詐騙分析',
    demo_fraud_probability: '詐騙機率：',
    demo_fraud_reason: '原因：',
    demo_meta: '中繼資料',

    toggle_legend: '處理模式',
    toggle_raw: 'Raw LLM',
    toggle_rag: 'LLM + RAG',

    upload_image_label: '圖片檔案',
    upload_prompt_label: '選填提示',
    upload_prompt_placeholder: '例如：概述文件中的重點',
    upload_selected: '已選擇：',
    upload_error_type: '請選擇有效的圖片檔案（PNG、JPEG 等）。',
    upload_error_size: '檔案過大，最大允許大小為 {size} MB。',
    upload_error_required: '請先選擇圖片檔案。',
    upload_processing: '處理中…',
    upload_process_raw: '處理 (Raw LLM)',
    upload_process_rag: '處理 (LLM+RAG)',

    audio_file_label: '音訊檔案',
    audio_selected: '已選擇：',
    audio_error_type: '請選擇有效的音訊檔案（wav、mp3、m4a、webm 等）。',
    audio_start_recording: '🎙 開始錄音',
    audio_stop_recording: '⏹ 停止錄音',
    audio_mic_denied: '麥克風權限被拒絕：',
    audio_language_label: '語言提示',
    audio_language_optional: '（選填，例如 en、zh、ja）',
    audio_language_placeholder: '自動偵測',
    audio_analyze_label: '同時對轉錄內容進行詐騙分析',
    audio_error_required: '請先選擇或錄製音訊檔案。',
    audio_transcribing: '轉錄中…',
    audio_transcribe: '轉錄音訊',
    audio_unknown: '未知',
  },

  // ─── Simplified Chinese (简体中文) ──────────────────────────────────
  'zh-hans': {
    lang_en: 'EN',
    lang_zhHant: '繁',
    lang_zhHans: '简',

    landing_badge: '🛡️ HK FraudGuard — AI 诈骗检测',
    landing_heading_prefix: 'HK FraudGuard — 以 ',
    landing_heading_highlight: 'AI + RAG',
    landing_tagline:
      '上传可疑文件或消息，我们的 AI 系统将自动提取文字、比对 606 起经证实的香港诈骗案例，并提供清晰的诈骗风险评估。',
    landing_try_demo: '🚀 立即试用',
    landing_mode_llm: '⚡ LLM — 快速直接分析',
    landing_mode_rag: '📖 LLM + RAG — 情境感知分析',
    landing_feature_ocr_title: 'OCR 文字提取',
    landing_feature_ocr_desc: '使用 GLM-OCR 自动从上传图片中读取文字。',
    landing_feature_llm_title: 'LLM 分析',
    landing_feature_llm_desc: 'DeepSeek LLM 分析提取的文字以识别诈骗指标。',
    landing_feature_rag_title: 'RAG 情境检索',
    landing_feature_rag_desc: '检索 606 起真实香港诈骗案例以提高分析准确度。',
    landing_footer: '由 VTC 学生团队制作 · HK01 知识库 · DeepSeek LLM',

    tutorial_skip: '跳过教程',
    tutorial_back: '← 返回',
    tutorial_next: '下一步 →',
    tutorial_start_demo: '🚀 开始试用',
    tutorial_step1_title: '欢迎使用 HK FraudGuard',
    tutorial_step1_p1:
      '此工具帮助您检查消息、信件或文件是否可能是诈骗。',
    tutorial_step1_p2:
      '香港有许多骗子假扮银行、政府机构或快递公司发送虚假消息。此应用程序能帮助您快速识别它们。',
    tutorial_step2_title: '第一步 — 拍摄照片',
    tutorial_step2_p1:
      '如果您收到纸质或屏幕上的可疑消息，请拍摄一张清晰的照片。',
    tutorial_step2_p2:
      '确保照片中的文字易于阅读——良好的光线和稳定的手部会有帮助。',
    tutorial_step2_tip:
      '提示：您也可以在手机上截图并使用该图片。',
    tutorial_step3_title: '第二步 — 上传图片',
    tutorial_step3_p1:
      '在下一个画面，按下标示「选择图片文件」的大按钮，然后选择您刚拍摄的照片。',
    tutorial_step3_p2:
      '应用程序会自动读取图片中的所有文字——您无需输入任何内容。',
    tutorial_step4_title: '第三步 — 选择分析模式',
    tutorial_step4_intro: '您会看到两个选项：',
    tutorial_step4_llm:
      'LLM — 使用人工智能快速检查。适合快速得到答案。',
    tutorial_step4_rag:
      'LLM + RAG — 更深入的检查，同时搜索数百起真实香港诈骗案例进行比较。更加全面。',
    tutorial_step4_recommend:
      '如果您不确定，请选择 LLM + RAG 以获得最准确的结果。',
    tutorial_step5_title: '第四步 — 阅读结果',
    tutorial_step5_intro: '按下「处理」后，应用程序会显示：',
    tutorial_step5_item1: '从图片中读取的文字',
    tutorial_step5_item2: 'AI 的诈骗风险评估',
    tutorial_step5_item3: '相关的过往诈骗案例（LLM + RAG 模式）',
    tutorial_step5_warning:
      '如果结果显示消息可疑，请勿回复或点击任何链接。请拨打香港警方 999 或防诈骗热线 18222。',
    tutorial_step6_title: '准备就绪！',
    tutorial_step6_p1:
      '您已了解如何使用 HK FraudGuard。按下「开始试用」即可亲自体验。',
    tutorial_step6_p2:
      '记住——每当您对收到的消息感到不确定时，都可以使用此应用程序来检查。它是免费的，只需不到一分钟。',
    tutorial_step6_safety:
      '注意网络安全。正规的银行和政府机构绝不会通过电话或消息要求您提供密码或完整的身份证号码。',

    demo_back_home: '← 返回首页',
    demo_heading: 'HK FraudGuard 演示',
    demo_description:
      '使用 OCR 或语音转文字分析可疑消息，然后通过 LLM 或 LLM + RAG 处理。',
    demo_tab_image: '🖼 图片 (OCR)',
    demo_tab_audio: '🎙 音频 (Whisper STT)',
    demo_audio_desc:
      '上传或录制音频，使用 OpenAI Whisper 进行转录。可选择对转录文字进行诈骗检测。',
    demo_results: '结果',
    demo_mode_label: '模式：',
    demo_ocr_text: 'OCR 提取文字',
    demo_retrieved: '检索段落 (RAG)',
    demo_llm_output: 'LLM 输出',
    demo_provenance: '来源信息',
    demo_error: '错误：',
    demo_empty: '（空）',
    demo_transcription: '转录结果',
    demo_language_label: '语言：',
    demo_transcribed_text: '转录文字',
    demo_segments: '段落',
    demo_fraud_analysis: '诈骗分析',
    demo_fraud_probability: '诈骗概率：',
    demo_fraud_reason: '原因：',
    demo_meta: '元数据',

    toggle_legend: '处理模式',
    toggle_raw: 'Raw LLM',
    toggle_rag: 'LLM + RAG',

    upload_image_label: '图片文件',
    upload_prompt_label: '选填提示',
    upload_prompt_placeholder: '例如：概述文件中的重点',
    upload_selected: '已选择：',
    upload_error_type: '请选择有效的图片文件（PNG、JPEG 等）。',
    upload_error_size: '文件过大，最大允许大小为 {size} MB。',
    upload_error_required: '请先选择图片文件。',
    upload_processing: '处理中…',
    upload_process_raw: '处理 (Raw LLM)',
    upload_process_rag: '处理 (LLM+RAG)',

    audio_file_label: '音频文件',
    audio_selected: '已选择：',
    audio_error_type: '请选择有效的音频文件（wav、mp3、m4a、webm 等）。',
    audio_start_recording: '🎙 开始录音',
    audio_stop_recording: '⏹ 停止录音',
    audio_mic_denied: '麦克风权限被拒绝：',
    audio_language_label: '语言提示',
    audio_language_optional: '（选填，例如 en、zh、ja）',
    audio_language_placeholder: '自动检测',
    audio_analyze_label: '同时对转录内容进行诈骗分析',
    audio_error_required: '请先选择或录制音频文件。',
    audio_transcribing: '转录中…',
    audio_transcribe: '转录音频',
    audio_unknown: '未知',
  },
};

// ─── Context & Provider ────────────────────────────────────────────────────────

const STORAGE_KEY = 'hk-fraudguard-lang';
const SUPPORTED_LANGS = ['en', 'zh-hant', 'zh-hans'];

const LanguageContext = createContext(null);

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {
    /* localStorage unavailable (SSR / private mode) */
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  const switchLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLang(newLang);
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations['en']?.[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, switchLang, t }), [lang, switchLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access the current language, the switcher, and the `t()` helper.
 *
 * @returns {{ lang: string, switchLang: (l:string)=>void, t: (key:string)=>string }}
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a <LanguageProvider>');
  }
  return ctx;
}
