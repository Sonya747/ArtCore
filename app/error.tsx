"use client"

import ErrorBoundary from "@/components/error-boundary"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return <ErrorBoundary error={error} reset={reset} />
}