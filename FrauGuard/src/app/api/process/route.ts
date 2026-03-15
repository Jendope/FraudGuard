import fs from 'fs/promises'
import path from 'path'
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
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Initialize ZAI (ensures .z-ai-config exists)
    const zai = await getZAI()

    // Read API credentials for direct GLM-OCR API call
    const configPath = path.join(process.cwd(), '.z-ai-config')
    const configRaw = await fs.readFile(configPath, 'utf-8')
    const { apiKey, baseUrl } = JSON.parse(configRaw) as { apiKey: string; baseUrl: string }

    if (!apiKey || !baseUrl) {
      throw new Error('Invalid .z-ai-config: missing apiKey or baseUrl')
    }

    // Use GLM-OCR layout_parsing endpoint for image text extraction
    let ocrText = ''
    let layoutDetails: GlmOcrLayoutItem[][] = []
    let layoutVisualization: string[] = []
    
    try {
      // Call the dedicated GLM-OCR layout parsing API
      // Endpoint: POST /layout_parsing, Model: glm-ocr
      // Docs: https://docs.bigmodel.cn/api-reference/模型-api/版面解析
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
        const errBody = await ocrRes.text()
        throw new Error(`GLM-OCR layout parsing request failed with status ${ocrRes.status}: ${errBody}`)
      }

      const ocrData = await ocrRes.json() as GlmOcrResponse

      if (ocrData.error) {
        throw new Error(`OCR API error ${ocrData.error.code}: ${ocrData.error.message}`)
      }

      // md_results is the full markdown text of the extracted document
      ocrText = (ocrData.md_results ?? '').trim()
      layoutDetails = ocrData.layout_details ?? []
      layoutVisualization = ocrData.layout_visualization ?? []
    } catch (visionError) {
      console.error('Vision error:', visionError)
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

      const completion = await zai.chat.completions.create({
        model: 'glm-5',
        messages: [
          { role: 'system', content: ragPrompt },
          { role: 'user', content: 'Please provide your analysis.' }
        ]
      })

      if (!completion || !completion.choices || completion.choices.length === 0) {
        console.error('Unexpected completion response (missing choices):', completion)
        return NextResponse.json(
          { error: 'Invalid response from analysis service' },
          { status: 502 }
        )
      }

      llmOutput = completion.choices[0]?.message?.content || ''
    } else {
      // Raw mode: direct analysis
      const rawPrompt = ANALYSIS_PROMPT
        .replace('{ocr_text}', ocrText)
        .replace('{prompt}', userPrompt)

      const completion = await zai.chat.completions.create({
        model: 'glm-5',
        messages: [
          { role: 'system', content: rawPrompt },
          { role: 'user', content: 'Please provide your analysis.' }
        ]
      })

      if (!completion || !completion.choices || completion.choices.length === 0) {
        console.error('Unexpected completion response (missing choices):', completion)
        return NextResponse.json(
          { error: 'Invalid response from analysis service' },
          { status: 502 }
        )
      }

      llmOutput = completion.choices[0]?.message?.content || ''
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
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}
