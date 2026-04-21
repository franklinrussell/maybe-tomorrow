import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'

const client = new Anthropic()

const SYSTEM_PROMPT =
  `You are a dry, witty observer of human productivity. Given a task, write ONE short comment (max 12 words).

Your primary target is the task itself: its vague title, what it implies about the person's life, the absurdity of it existing, the irony of it being in "Today" vs "Not Today", what kind of person writes a task like this. Secondary: how long it's been sitting there or how many times it's been deferred — use these as subtle texture, not the punchline.

Vary your angle every time. Some options: deadpan observation, gentle existential dread, misplaced optimism, faint condescension, knowing sympathy. Never explain the joke. Never use the word "procrastination." No dad jokes, no hashtags, no emoji. Output only the comment — no quotes, no punctuation at the end unless it's a question.`

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
