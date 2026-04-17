import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { SupportAutoReply } from '@/emails/SupportAutoReply'

// In-memory rate limit: email → last submission timestamp
const recentSubmissions = new Map<string, number>()

const RATE_LIMIT_MS = 60_000

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await req.json()
    const { name, email, category, message } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !category?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Rate limit: one submission per email per 60 seconds
    const key = email.toLowerCase().trim()
    const lastSeen = recentSubmissions.get(key)
    if (lastSeen && Date.now() - lastSeen < RATE_LIMIT_MS) {
      return NextResponse.json({ error: 'Please wait a moment before submitting again.' }, { status: 429 })
    }
    recentSubmissions.set(key, Date.now())

    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Los_Angeles',
    })

    const notifyBody = `
New support message from Maybe Tomorrow

Name:     ${name}
Email:    ${email}
Category: ${category}
Time:     ${timestamp}

Message:
${message}
    `.trim()

    // Render branded HTML auto-reply
    const autoReplyHtml = await render(
      SupportAutoReply({ name, category, message })
    )

    // Send notification to support inbox
    await resend.emails.send({
      from: 'Maybe Tomorrow Support <noreply@onejsonfile.com>',
      to: 'fjr@fjr.com',
      replyTo: email,
      subject: `Maybe Tomorrow Support: ${category} from ${name}`,
      text: notifyBody,
    })

    // Auto-reply to sender with branded HTML template
    await resend.emails.send({
      from: 'Maybe Tomorrow <noreply@onejsonfile.com>',
      to: email,
      subject: 'We got your message — Maybe Tomorrow',
      html: autoReplyHtml,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[support] error:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
