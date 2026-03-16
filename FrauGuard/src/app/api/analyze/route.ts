import { NextRequest, NextResponse } from 'next/server'
import { getZAI } from '@/lib/zai'
import OpenAI from 'openai'
import { API_BASE_URL } from '@/lib/site-config'

// Fraud detection prompt
const FRAUD_PROMPT = `You are an anti-fraud expert specializing in detecting scams, phishing, and fraudulent messages. 

Analyze the following message and determine if it's a potential scam or fraud attempt.

Message to analyze:
"{text}"

Focus on analyzing:
1. Whether it involves common scam tactics (e.g., "verify identity", "urgent transfer", "winning a prize", "account suspended", impersonation, urgency)
2. Whether it impersonates official organizations (banks, police, couriers, government)
3. Whether it induces clicking links / downloading apps / providing verification codes
4. Whether it creates urgency or fear to prompt action
5. Whether it asks for personal information, passwords, or financial details

Respond ONLY with valid JSON in this exact format (no other text):
{
  "score": <number 0-10 where 0 is definitely safe and 10 is definitely a scam>,
  "reason": "<brief explanation in 1-2 sentences, under 100 characters>",
  "scam_tactics": ["<tactic 1>", "<tactic 2>"],
  "prevention_advice": "<actionable advice to avoid this scam, in English>",
  "warning_message": "<clear warning message for the user, in English>"
}`

/** Returns true when the model ID looks like a Qwen / DashScope model. */
function isQwenModel(model: string): boolean {
  return model.startsWith('qwen')
}

/**
 * Call a Qwen model via the DashScope OpenAI-compatible API.
 * Uses the DASHSCOPE_API_KEY env var on the server side.
 */
async function callQwen(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is not set. Please add it to your environment variables.')
  }

  const client = new OpenAI({
    apiKey,
    // ✅ FIX: Removed trailing spaces from baseURL
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  })

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are an anti-fraud expert. Respond only in the requested JSON format without any additional text.',
      },
      { role: 'user', content: prompt },
    ],
  })

  return completion.choices[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, model = 'glm-5', mode = 'raw' } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text cannot be empty' },
        { status: 400 }
      )
    }

    // ----- RAG mode: proxy to Flask backend which has ChromaDB + embeddings -----
    if (mode === 'rag') {
      try {
        const backendRes = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: 'en' }),
        })

        const backendData = await backendRes.json()

        if (backendData.success) {
          return NextResponse.json({
            success: true,
            probability: backendData.probability,
            reason: backendData.reason,
            scamTactics: backendData.scam_tactics ?? [],
            preventionAdvice: backendData.prevention_advice ?? '',
            warningMessage: backendData.warning_message ?? '',
            scamType: 'unknown',
            input_length: text.length,
            model: 'qwen (RAG)',
          })
        } else {
          return NextResponse.json(
            { success: false, error: backendData.error || 'Backend RAG analysis failed' },
            { status: 502 }
          )
        }
      } catch (backendError) {
        console.error('Backend RAG call failed:', backendError)
        return NextResponse.json(
          { success: false, error: 'Failed to connect to RAG backend. Ensure the Flask backend is running.' },
          { status: 502 }
        )
      }
    }

    // ----- Raw mode: call the LLM directly -----
    const formattedPrompt = FRAUD_PROMPT.replace('{text}', text)
    let response = ''

    if (isQwenModel(model)) {
      // Qwen models: use DashScope OpenAI-compatible API
      response = await callQwen(formattedPrompt, model)
    } else {
      // GLM / other models: use ZAI SDK
      const zai = await getZAI()

      const completion = await zai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: formattedPrompt },
          { role: 'user', content: 'Please analyze this message for fraud potential.' },
        ],
      })

      if (!completion || !completion.choices || completion.choices.length === 0) {
        console.error('Unexpected completion response (missing choices):', completion)
        return NextResponse.json(
          { success: false, error: 'Invalid response from analysis service' },
          { status: 502 }
        )
      }

      response = completion.choices[0]?.message?.content || ''
    }

    // Parse the JSON response
    let probability = 0.5
    let reason = 'Unable to analyze'
    let scamType = 'unknown'
    let scamTactics: string[] = []
    let preventionAdvice = ''
    let warningMessage = ''

    // ✅ FIX: Defensive JSON parsing with detailed logging
    try {
      // Log raw response for debugging (first 300 chars)
      console.log("🔍 Raw LLM response:", response ? response.substring(0, 300) + '...' : '(empty)')
      
      if (!response || response.trim() === '') {
        throw new Error("Empty response from LLM")
      }
      
      // Try to extract JSON object from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error(`No JSON object found in response: "${response.substring(0, 100)}..."`)
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and extract fields with fallbacks
      const score = typeof parsed.score === 'number' 
        ? Math.max(0, Math.min(10, parsed.score)) 
        : 5 // Default to neutral if missing/invalid
      probability = score / 10
      reason = typeof parsed.reason === 'string' && parsed.reason ? parsed.reason : 'Analysis completed'
      scamType = typeof parsed.type === 'string' ? parsed.type : 'unknown'
      scamTactics = Array.isArray(parsed.scam_tactics) ? parsed.scam_tactics : []
      preventionAdvice = typeof parsed.prevention_advice === 'string' ? parsed.prevention_advice : ''
      warningMessage = typeof parsed.warning_message === 'string' ? parsed.warning_message : ''
      
    } catch (parseError) {
      console.error("❌ JSON parse failed:", {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: response?.substring(0, 200),
        responseType: typeof response
      })
      // Return safe fallback instead of crashing
      reason = `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`
      probability = 0.5 // Neutral default
    }

    return NextResponse.json({
      success: true,
      probability,
      reason,
      scamType,
      scamTactics,
      preventionAdvice,
      warningMessage,
      input_length: text.length,
      model
    })

  } catch (error) {
    console.error('Fraud analysis error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to analyze text' },
      { status: 500 }
    )
  }
}