import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '40px',
          backgroundColor: '#FFE500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="124" height="124" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="50" x2="74" y2="50" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="square"/>
          <polyline points="56,28 78,50 56,72" fill="none" stroke="#1a1a1a" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter"/>
        </svg>
      </div>
    ),
    { ...size },
  )
}
