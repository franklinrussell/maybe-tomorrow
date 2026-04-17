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

interface SupportNotificationProps {
  name: string
  email: string
  category: string
  message: string
  timestamp: string
}

export function SupportNotification({ name, email, category, message, timestamp }: SupportNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{category} from {name} — {email}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>MAYBE TOMORROW — Support Request</Text>
          </Section>

          <Section style={content}>
            <table cellPadding="0" cellSpacing="0" style={fieldTable}>
              <tr>
                <td style={fieldLabel}>Name</td>
                <td style={fieldValue}>{name}</td>
              </tr>
              <tr>
                <td style={fieldLabel}>Email</td>
                <td style={fieldValue}>{email}</td>
              </tr>
              <tr>
                <td style={fieldLabel}>Category</td>
                <td style={fieldValue}>{category}</td>
              </tr>
              <tr>
                <td style={fieldLabel}>Time</td>
                <td style={fieldValue}>{timestamp}</td>
              </tr>
            </table>

            <Text style={messageLabel}><strong>Message</strong></Text>
            <Text style={messageBox}>{message}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Text style={footer}>
              maybetomorrow.app · Reply directly to this email to respond to {name}.
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
  fontSize: '15px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '0.06em',
}

const content: React.CSSProperties = {
  padding: '32px 32px 24px',
}

const fieldTable: React.CSSProperties = {
  marginBottom: '20px',
  fontSize: '15px',
  width: '100%',
}

const fieldLabel: React.CSSProperties = {
  fontWeight: '700',
  color: '#18181b',
  paddingRight: '16px',
  paddingTop: '3px',
  paddingBottom: '3px',
  whiteSpace: 'nowrap',
  verticalAlign: 'top',
  width: '80px',
}

const fieldValue: React.CSSProperties = {
  color: '#52525b',
  paddingTop: '3px',
  paddingBottom: '3px',
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
  margin: '0',
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '12px 16px',
  whiteSpace: 'pre-wrap' as const,
}

const hr: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '24px 32px 0',
}

const footer: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  lineHeight: '1.5',
  padding: '16px 32px 24px',
  margin: '0',
}
