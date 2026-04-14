import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getUserId } from '@/lib/get-user-id'
import { Task } from '@/types'

const client = new Anthropic()

const PROMPTS = {
  focus: (tasks: Task[]) =>
    `Here are my current tasks:\n${tasks.map((t) => `- [${t.state}] ${t.title}`).join('\n')}\n\nGiven these tasks, which 1-3 should I focus on TODAY? Be direct and brief. Return your answer as a JSON object with keys "suggestions" (array of strings) and "taskIds" (array of task IDs you're recommending).`,
  blowup_candidates: (tasks: Task[]) =>
    `Here are my Today tasks:\n${tasks.map((t) => `- [id:${t.id}] [${t.state}] ${t.title}${t.blownUpCount > 0 ? ` (blown up ${t.blownUpCount}x)` : ''}`).join('\n')}\n\nWhich of these have I been avoiding? Flag the ones I should either commit to or move permanently to Not Today. Return as JSON with keys "suggestions" (array of strings) and "taskIds" (array of flagged task IDs).`,
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { tasks: Task[]; type: 'focus' | 'blowup_candidates' }
  const prompt = PROMPTS[body.type](body.tasks)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ suggestions: [text], taskIds: [] })

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
