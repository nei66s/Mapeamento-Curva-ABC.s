'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        <main style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', fontSize: 12, background: '#f5f5f5', padding: 12 }}>
            {error.message}
          </pre>
          {error.digest && (
            <p style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              cursor: 'pointer',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: 4,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
