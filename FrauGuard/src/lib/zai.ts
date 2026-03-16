if (typeof process !== 'undefined' && process.env.VERCEL) {
  process.env.Z_AI_CONFIG_PATH = '/tmp/.z-ai-config';
}

import fs from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * Ensures .z-ai-config exists (generated from environment variables)
 * then returns an initialized ZAI instance.
 *
 * Required env vars:
 *   ZAI_API_KEY  – API key for the Z-AI compatible service
 *   ZAI_BASE_URL – Full base URL for the API (e.g. https://open.bigmodel.cn/api/paas/v4)
 */

let configReady: Promise<void> | null = null

async function ensureConfig(): Promise<void> {
  const configPath = path.join(process.cwd(), '.z-ai-config')

  try {
    await fs.access(configPath)
  } catch {
    // File does not exist – create it from env vars
    const apiKey = process.env.ZAI_API_KEY
    const baseUrl = process.env.ZAI_BASE_URL

    if (!apiKey || !baseUrl) {
      throw new Error(
        'Missing ZAI_API_KEY or ZAI_BASE_URL environment variables. ' +
        'Please set them in your .env file or create a .z-ai-config manually.'
      )
    }

    const config = JSON.stringify({ baseUrl, apiKey }, null, 2)
    await fs.writeFile(configPath, config, 'utf-8')
  }
}

export async function getZAI(): Promise<ZAI> {
  if (!configReady) {
    configReady = ensureConfig()
  }
  await configReady

  return ZAI.create()
}
