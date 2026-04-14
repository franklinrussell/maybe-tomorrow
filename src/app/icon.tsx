import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '7px',
          backgroundColor: '#111111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: '#FFE500',
            fontSize: '21px',
            fontWeight: 900,
            fontFamily: '"Arial Black", "Impact", sans-serif',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            marginTop: '-1px',
          }}
        >
          N!
        </div>
      </div>
    ),
    { ...size },
  )
}
