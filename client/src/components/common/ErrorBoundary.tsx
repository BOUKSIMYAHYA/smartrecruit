import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-[#e2e5e7] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {this.props.fallbackTitle || 'Une erreur inattendue est survenue'}
              </h3>
              <p className="text-xs text-[#868889] mt-1 font-mono">
                {this.state.error?.message || 'Erreur lors du rendu du composant.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser la page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
