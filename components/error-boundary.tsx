"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm max-w-md w-full">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">Connection Lost</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              We encountered an unexpected error with your order. Our servers might be experiencing a hiccup.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-bold text-accent-foreground hover:bg-accent/90 transition"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
