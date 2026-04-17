import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface SupportAutoReplyProps {
  name: string
  category: string
  message: string
}

export function SupportAutoReply({ name, category, message }: SupportAutoReplyProps) {
  const firstName = name.split(' ')[0]
  return (
    <Html>
      <Head />
      <Preview>We received your message — we&apos;ll respond maybe tomorrow.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>→ MAYBE TOMORROW</Text>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {firstName},</Text>
            <Text style={paragraph}>
              Thanks for reaching out. We received your message.
            </Text>
            <table cellPadding="0" cellSpacing="0" style={fieldTable}>
              <tr>
                <td style={fieldLabel}>Category</td>
                <td style={fieldValue}>{category}</td>
              </tr>
            </table>
            <Text style={messageLabel}><strong>Message</strong></Text>
            <Text style={messageBox}>{message}</Text>
            <Text style={paragraph}>We&apos;ll respond maybe tomorrow.</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              You&apos;re receiving this because you submitted a support request at maybetomorrow.app.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#fafafa',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  maxWidth: '560px',
  borderRadius: '12px',
  border: '1px solid #e4e4e7',
}

const header: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  borderRadius: '12px 12px 0 0',
  padding: '24px 32px',
}

const brand: React.CSSProperties = {
  color: '#FFE500',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '0.06em',
}

const content: React.CSSProperties = {
  padding: '32px 32px 24px',
}

const paragraph: React.CSSProperties = {
  color: '#52525b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const fieldTable: React.CSSProperties = {
  marginBottom: '16px',
  fontSize: '15px',
}

const fieldLabel: React.CSSProperties = {
  fontWeight: '700',
  color: '#18181b',
  paddingRight: '16px',
  paddingTop: '2px',
  paddingBottom: '2px',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
}

const fieldValue: React.CSSProperties = {
  color: '#52525b',
  paddingTop: '2px',
  paddingBottom: '2px',
}

const messageLabel: React.CSSProperties = {
  color: '#18181b',
  fontSize: '15px',
  margin: '0 0 6px',
}

const messageBox: React.CSSProperties = {
  color: '#52525b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '12px 16px',
  whiteSpace: 'pre-wrap' as const,
}

const hr: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '0 32px',
}

const footer: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '16px 32px 24px',
  margin: '0',
}
