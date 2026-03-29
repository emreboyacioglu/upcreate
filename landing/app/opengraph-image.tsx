import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Creator Commerce'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: '#FAFAFA',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 700,
          padding: '80px',
        }}
      >
        <div style={{ color: '#0A0A0A', textAlign: 'center' }}>
          Creator Marketing Değil.
        </div>
        <div style={{ color: '#0066FF', textAlign: 'center', marginTop: '20px' }}>
          Creator Commerce.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
