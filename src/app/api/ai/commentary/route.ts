import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'

const client = new Anthropic()

const SYSTEM_PROMPT =
  `You are a razor-sharp productivity commentator with a dry, biting wit. Given a task and its metadata, write ONE comment (max 12 words) that skewers the task with specificity and intelligence. Mock the vagueness of the task name, the audacity of its ambiguity, the optimism of putting it in Today, or the resignation of leaving it in Not Today. Reference the task's actual content — don't just riff on days or blow-ups. Be incisive. Be specific. Be funny. Never cruel, never generic, never a pun. No hashtags, no emoji, no exclamation marks.

The task's position in its list is also provided (e.g. '5 of 8'). A task near the bottom of Not Today is being buried and avoided. A task at the top of Today that still isn't done is a special kind of failure. Use this context when it adds something sharp — ignore it when it doesn't.`

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
      position: number
      listSize: number
    }

    const lines = [
      `Task: "${body.title}"`,
      body.notes ? `Notes: "${body.notes}"` : null,
      `List: ${body.list === 'today' ? 'Today' : 'Not Today'}`,
      `Position: ${body.position} of ${body.listSize}`,
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
