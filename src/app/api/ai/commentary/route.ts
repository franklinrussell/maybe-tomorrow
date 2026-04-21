import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'

const client = new Anthropic()

const SYSTEM_PROMPT =
  "You are a brutally honest, mildly snarky productivity coach. Given a task and its metadata, write ONE short comment (max 12 words) that gently roasts the user based on how long it's been sitting there, how many times it's been blown up, or what the task actually is. Be clever, not mean. No hashtags, no emoji."

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as {
      taskId: string
      title: string
      notes?: string
      list: string
      daysSinceCreated: number
      blownUpCount: number
    }

    const lines = [
      `Task: "${body.title}"`,
      body.notes ? `Notes: "${body.notes}"` : null,
      `List: ${body.list === 'today' ? 'Today' : 'Not Today'}`,
      `Age: ${body.daysSinceCreated} day${body.daysSinceCreated !== 1 ? 's' : ''}`,
      body.blownUpCount > 0
        ? `Blown up ${body.blownUpCount} time${body.blownUpCount !== 1 ? 's' : ''}`
        : null,
    ].filter(Boolean).join('\n')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: lines }],
    })

    const comment = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ taskId: body.taskId, comment })
  } catch {
    return NextResponse.json({ taskId: '', comment: '' })
  }
}
