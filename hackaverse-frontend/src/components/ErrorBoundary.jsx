import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="uil uil-exclamation-triangle text-error-red text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-text-muted mb-6">
              We encountered an unexpected error. Please refresh the page or try again later.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-primary-purple to-secondary-cyan text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 border border-border-light text-text-light rounded-xl hover:bg-white/5 transition-all"
              >
                Go Home
              </button>
            </div>
            {import.meta.env.MODE === 'development' && (
              <details className="mt-6 text-left">
                <summary className="text-text-muted cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-error-red bg-bg-card p-3 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;