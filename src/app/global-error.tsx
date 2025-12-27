"use client"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html>
      <body style={{ fontFamily: 'var(--font-body)' }}>
        <main style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', fontSize: 12, background: '#f5f5f5', padding: 12 }}>
            {String(error?.message ?? error)}
          </pre>
          {error?.digest && (
            <p style={{ color: '#999', fontSize: 12, marginTop: 16 }}>
              Error ID: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
