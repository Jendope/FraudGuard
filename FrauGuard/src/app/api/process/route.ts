import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/zai'
import { OCR_MODEL, OCR_CONFIG, getCurrentOcrConfig, type OcrModelKey } from '@/lib/site-config'
import OpenAI from 'openai'

// GLM-OCR API response types (file upload endpoint)
interface GlmOcrWordResult {
  words: string
  location?: { left: number; top: number; width: number; height: number }
  probability?: { average: number; variance: number; min: number }
}

interface GlmOcrFileResponse {
  task_id?: string
  message?: string
  status?: string
  words_result_num?: number
  words_result?: GlmOcrWordResult[]
  error?: { code: string; message: string }
}

// OCR analysis prompt
const ANALYSIS_PROMPT = `Analyze the following content and provide helpful insights.

Extracted text from the image:
"{ocr_text}"

User request: {prompt}

If the content appears to be a scam or fraudulent message (like phishing, lottery scams, fake bank messages, etc.), clearly warn the user about the potential dangers.

Respond in a clear, easy-to-understand manner suitable for all ages including elderly users.`

// ✅ Helper: Get correct LLM client based on model provider
async function getLLMClient(model: string) {
  const isQwen = model.startsWith('qwen')
  
  if (isQwen) {
    // ✅ Qwen: Use OpenAI SDK with DashScope OpenAI-compatible endpoint
    return new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    })
  } else {
    // ✅ GLM: Use zai SDK with BigModel endpoint (configured in zai.ts)
    return await getZAI()
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = formData.get('mode') as string || 'raw'
    const prompt = formData.get('prompt') as string || ''
    // ✅ Allow override via request, but default to config
    const ocrModel = (formData.get('ocr_model') as string) || OCR_MODEL
    // ✅ Allow LLM model override, default to config (Qwen by default)
    const llmModel = (formData.get('llm_model') as string) || 
                     process.env.LLM_MODEL || 
                     'qwen3.5-plus'  // ✅ Qwen default

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    const isValidType = validTypes.some(t => file.type === t) || 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file (JPG, PNG, GIF, WebP)' },
        { status: 400 }
      )
    }

    // Convert file to base64 (for Qwen) AND keep original File (for GLM)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Check file size (Vercel Hobby limit: ~4.5MB request body)
    if (buffer.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Please upload an image under 4MB.' },
        { status: 400 }
      )
    }
    
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const apiKey = (process.env.Z_AI_API_KEY || process.env.DASHSCOPE_API_KEY || '').trim()
    const baseUrl = (process.env.Z_AI_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').trim()

    if (!apiKey) {
      console.error('❌ Missing API key. Set Z_AI_API_KEY or DASHSCOPE_API_KEY in environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      )
    }

    // ✅ Get validated model config from site-config.ts
    const modelConfig = getCurrentOcrConfig(ocrModel)
    console.log("🔍 OCR Model Selected:", { 
      requested: ocrModel, 
      using: OCR_MODEL, 
      provider: modelConfig.provider,
      endpoint: modelConfig.endpoint,
      isChatFormat: modelConfig.isChatFormat 
    })

    // Use appropriate OCR endpoint based on model
    let ocrText = ''
    let layoutDetails = []
    let layoutVisualization = []
    
    try {
      console.log("🔍 Calling OCR API...", { model: ocrModel, provider: modelConfig.provider })
      
      let apiUrl: string
      if (modelConfig.isChatFormat) {
        // Qwen VL OCR: Use OpenAI-compatible /chat/completions endpoint
        apiUrl = `${baseUrl}/chat/completions`.trim()
      } else {
        // GLM-OCR: Use file upload endpoint
        apiUrl = `${baseUrl}${modelConfig.endpoint}`.trim()
      }
      
      console.log("🔗 OCR API Request:", {
        url: apiUrl,
        model: ocrModel,
        mimeType: mimeType,
        base64Length: base64.length,
        hasTrailingSpace: apiUrl.endsWith(' '),
        apiKeySet: !!apiKey,
        format: modelConfig.isChatFormat ? 'json' : 'multipart'
      })
      
      let ocrRes: Response
      
      if (modelConfig.isChatFormat) {
        // ✅ Qwen VL OCR via OpenAI-compatible endpoint (JSON body)
        const requestBody = {
          model: ocrModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`
                  },
                  min_pixels: 32 * 32 * 3,    // 3K min
                  max_pixels: 32 * 32 * 8192  // 8K max
                }
              ]
            }
          ]
        }
        
        ocrRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        })
      } else {
        // ✅ GLM-OCR via file upload endpoint (multipart/form-data)
        const formData = new FormData()
        
        // Convert base64 back to Blob for file upload
        const binary = atob(base64)
        const array = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([array], { type: mimeType })
        
        formData.append('file', blob, `upload.${mimeType.split('/')[1] || 'png'}`)
        formData.append('tool_type', 'hand_write')  // or 'print' for printed text
        formData.append('language_type', 'CHN_ENG')
        formData.append('probability', 'true')
        
        ocrRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        })
      }

      if (!ocrRes.ok) {
        const errBody = await ocrRes.text().catch(() => 'No error body')
        console.error(`❌ OCR API error (${ocrModel}): ${ocrRes.status} - ${errBody}`)
        throw new Error(`OCR request failed: ${ocrRes.status} - ${errBody}`)
      }

      const ocrData = await ocrRes.json()
      console.log("📄 OCR Raw Response Preview:", 
        JSON.stringify(ocrData, null, 2).substring(0, 500) + '...')

      // ✅ Parse response based on format
      if (modelConfig.isChatFormat) {
        // ✅ Qwen via OpenAI-compatible: response in choices[0].message.content
        const content = (ocrData as any).choices?.[0]?.message?.content || ''
        
        // Try to parse as JSON if prompt requested it, otherwise use raw text
        try {
          const parsed = JSON.parse(content)
          ocrText = parsed.text || parsed.content || JSON.stringify(parsed)
        } catch {
          ocrText = content.trim()
        }
        
        // OpenAI-compatible OCR doesn't return layout details
        layoutDetails = []
        layoutVisualization = []
      } else {
        // ✅ GLM-OCR response: { words_result: [{ words: "..." }], task_id: "..." }
        const glmData = ocrData as GlmOcrFileResponse
        
        if (glmData.error) {
          throw new Error(`GLM OCR error: ${glmData.error.message}`)
        }
        
        if (glmData.words_result?.length) {
          ocrText = glmData.words_result.map(r => r.words).join('\n').trim()
        } else {
          console.warn("⚠️ GLM-OCR: No words found in response")
          ocrText = ''
        }
        // GLM file upload endpoint doesn't return layout_details
        layoutDetails = []
        layoutVisualization = []
      }
      
      console.log("✅ OCR extracted:", 
        ocrText.substring(0, 100) + (ocrText.length > 100 ? '...' : ''))
      
    } catch (visionError) {
      console.error('❌ Vision processing error:', visionError)
      return NextResponse.json(
        { error: 'Failed to process image. Please try a different image.' },
        { status: 500 }
      )
    }

    // Generate LLM response based on mode
    let llmOutput = ''
    let retrieved: string[] | null = null

    const userPrompt = prompt || 'Please analyze this content and provide insights. Warn if this appears to be a scam or fraudulent content.'

    if (mode === 'rag') {
      // RAG mode: chunk the OCR text and provide context
      const chunks = ocrText.split(/\n\n+/).filter(Boolean)
      retrieved = chunks.slice(0, 3)
      
      const ragPrompt = `You are an AI assistant analyzing document content for fraud detection and information extraction.

Document content:
${ocrText}

Context chunks retrieved from document:
${retrieved.map((c, i) => `[${i + 1}] ${c}`).join('\n')}

User request: ${userPrompt}

Please provide a comprehensive analysis. 
- If this appears to be a scam or fraudulent content, clearly warn the user with specific reasons.
- If it's a legitimate document, summarize the key information.
- Be thorough but easy to understand for all ages.`

      try {
        // ✅ Use dynamic client based on model provider
        const client = await getLLMClient(llmModel)
        const completion = await client.chat.completions.create({
          model: llmModel,
          messages: [
            { role: 'system', content: ragPrompt },
            { role: 'user', content: 'Please provide your analysis.' }
          ]
        })

        if (!completion?.choices?.length) {
          throw new Error('Empty or invalid completion response')
        }

        llmOutput = completion.choices[0]?.message?.content || ''
      } catch (llmError) {
        console.error('❌ RAG LLM call failed:', llmError)
        llmOutput = 'Analysis unavailable due to processing error.'
      }
    } else {
      // Raw mode: direct analysis
      const rawPrompt = ANALYSIS_PROMPT
        .replace('{ocr_text}', ocrText)
        .replace('{prompt}', userPrompt)

      try {
        // ✅ Use dynamic client based on model provider
        const client = await getLLMClient(llmModel)
        const completion = await client.chat.completions.create({
          model: llmModel,
          messages: [
            { role: 'system', content: rawPrompt },
            { role: 'user', content: 'Please provide your analysis.' }
          ]
        })

        if (!completion?.choices?.length) {
          throw new Error('Empty or invalid completion response')
        }

        llmOutput = completion.choices[0]?.message?.content || ''
      } catch (llmError) {
        console.error('❌ Raw LLM call failed:', llmError)
        llmOutput = 'Analysis unavailable due to processing error.'
      }
    }

    return NextResponse.json({
      mode,
      ocr_model: ocrModel,
      ocr_provider: modelConfig.provider,
      llm_model: llmModel,
      ocr_text: ocrText,
      layout_details: layoutDetails,
      layout_visualization: layoutVisualization,
      retrieved,
      llm_output: llmOutput,
      provenance: {
        mode,
        ocr_model: ocrModel,
        ocr_provider: modelConfig.provider,
        llm_model: llmModel,
        chunk_count: mode === 'rag' ? ocrText.split(/\n\n+/).length : undefined
      }
    })

  } catch (error) {
    console.error('❌ OCR processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    )
  }
}