"use client";

import React, { Component, type ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class JournalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for developer visibility; replace with Sentry later
    console.error("[JournalErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <GlassCard className="p-8 text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink-text font-serif">Journal Couldn&apos;t Load</h3>
            <p className="text-xs text-ink-soft leading-relaxed max-w-xs mx-auto">
              A journal entry may have invalid content. Your other entries are safe. Try refreshing this view.
            </p>
          </div>
          <GlassButton
            variant="secondary"
            onClick={this.handleReset}
            className="mx-auto py-2 px-4 text-xs gap-2 flex items-center"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </GlassButton>
        </GlassCard>
      );
    }
    return this.props.children;
  }
}
