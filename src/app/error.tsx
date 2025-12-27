"use client"
import React from 'react'

export default function RootError({ error, reset }: { error?: any, reset?: () => void }) {
  return (
    <main style={{ padding: 24, fontFamily: 'var(--font-body)' }}>
      <h1>Application error</h1>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(error?.message ?? error)}</pre>
      {reset && (
        <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
          Try again
        </button>
      )}
    </main>
  )
}
