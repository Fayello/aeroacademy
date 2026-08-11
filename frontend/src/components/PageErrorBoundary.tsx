"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500 mt-1">
              {this.props.pageName ? `Failed to load ${this.props.pageName}` : "This section encountered an error"}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-secondary text-sm"
          >
            <RefreshCcw size={14} />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
