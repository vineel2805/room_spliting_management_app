import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (could also send to error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-error-light rounded-full flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-sm text-text-secondary text-center mb-6 max-w-sm">
            The app encountered an unexpected error. Don't worry, your data is safe.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="w-full h-12 bg-primary text-white rounded-button text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Reload App
            </button>
            <button
              onClick={this.handleGoHome}
              className="w-full h-12 bg-surface border border-divider text-text-primary rounded-button text-sm font-medium hover:bg-background active:scale-[0.98] transition-all"
            >
              Go to Home
            </button>
          </div>

          {/* Error Details (collapsible in dev mode) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-8 w-full max-w-md">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                View error details
              </summary>
              <div className="mt-2 p-4 bg-surface border border-divider rounded-card overflow-auto">
                <pre className="text-xs text-error whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
