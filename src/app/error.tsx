"use client"
import React from 'react'

export default function RootError({ error }: { error?: any }) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        <main style={{ padding: 24 }}>
          <h1>Application error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(error?.message ?? error)}</pre>
        </main>
      </body>
    </html>
  )
}
