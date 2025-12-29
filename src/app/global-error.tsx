"use client"

import styles from "./global-error.module.css"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  return (
    <html>
      <body className={styles.body}>
        <main className={styles.main}>
          <h1>Something went wrong</h1>
          <p className={styles.message}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <pre className={styles.errorPre}>
            {String(error?.message ?? error)}
          </pre>
          {error?.digest && (
            <p className={styles.digest}>
              Error ID: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  )
}
