import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/zai'

// GLM-OCR API response types (BigModel layout parsing)
interface GlmOcrLayoutItem {
  index: number
  label: string
  bbox_2d: [number, number, number, number]
  content: string
  height: number
  width: number
}

interface GlmOcrResponse {
  id: string
  created: number
  model: string
  md_results: string
  layout_details: GlmOcrLayoutItem[][]
  layout_visualization: string[]
  error?: { code: string; message: string }
}

// OCR analysis prompt
const ANALYSIS_PROMPT = `Analyze the following content and provide helpful insights.

Extracted text from the image:
"{ocr_text}"

User request: {prompt}

If the content appears to be a scam or fraudulent message (like phishing, lottery scams, fake bank messages, etc.), clearly warn the user about the potential dangers.

Respond in a clear, easy-to-understand manner suitable for all ages including elderly users.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mode = formData.get('mode') as string || 'raw'
    const prompt = formData.get('prompt') as string || ''

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
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

    // Convert file to base64
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

    const apiKey = process.env.Z_AI_API_KEY || process.env.DASHSCOPE_API_KEY
    const baseUrl = process.env.Z_AI_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'

    if (!apiKey) {
      console.error('❌ Missing API key. Set Z_AI_API_KEY or DASHSCOPE_API_KEY in environment variables.')
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      )
    }

    // Initialize ZAI (with /tmp fix in src/lib/zai.ts)
    const zai = await getZAI()

    // Use GLM-OCR layout_parsing endpoint for image text extraction
    let ocrText = ''
    let layoutDetails: GlmOcrLayoutItem[][] = []
    let layoutVisualization: string[] = []
    
    try {
      console.log("🔍 Calling GLM-OCR API...")
      
      const ocrRes = await fetch(`${baseUrl}/layout_parsing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'glm-ocr',
          image_url: {
            url: `data:${mimeType};base64,${base64}`
          }
        })
      })

      if (!ocrRes.ok) {
        const errBody = await ocrRes.text().catch(() => 'No error body')
        console.error(`❌ GLM-OCR API error: ${ocrRes.status} - ${errBody}`)
        throw new Error(`GLM-OCR request failed: ${ocrRes.status}`)
      }

      const ocrData = await ocrRes.json() as GlmOcrResponse

      if (ocrData.error) {
        throw new Error(`OCR API error ${ocrData.error.code}: ${ocrData.error.message}`)
      }

      ocrText = (ocrData.md_results ?? '').trim()
      layoutDetails = ocrData.layout_details ?? []
      layoutVisualization = ocrData.layout_visualization ?? []
      
      console.log("✅ OCR extracted:", ocrText.substring(0, 100) + (ocrText.length > 100 ? '...' : ''))
      
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
        const completion = await zai.chat.completions.create({
          model: 'glm-5',
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
        const completion = await zai.chat.completions.create({
          model: 'glm-5',
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
      ocr_text: ocrText,
      layout_details: layoutDetails,
      layout_visualization: layoutVisualization,
      retrieved,
      llm_output: llmOutput,
      provenance: {
        mode,
        model: 'glm-5',
        ocr_model: 'GLM-OCR',
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