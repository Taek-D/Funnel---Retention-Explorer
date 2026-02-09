import React from 'react';
import { AlertTriangle } from './Icons';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-coral" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              오류가 발생했습니다
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              예기치 않은 문제가 발생했습니다. 페이지를 새로고침하거나 아래 버튼을 눌러주세요.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs text-slate-600 bg-surface rounded-lg p-3 mb-6 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-white rounded-md transition-all"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
