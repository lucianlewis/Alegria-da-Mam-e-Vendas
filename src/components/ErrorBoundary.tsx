import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed.error) {
          if (parsed.error.includes('Missing or insufficient permissions')) {
            displayMessage = "You don't have permission to perform this action. Please ensure you are an administrator.";
          } else {
            displayMessage = `Error: ${parsed.error}`;
          }
        }
      } catch (e) {
        displayMessage = this.state.errorMessage;
      }

      return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-rose-500 mb-4">Application Error</h2>
          <p className="text-slate-400 mb-8">{displayMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-xl font-bold"
          >
            Reload Application
          </button>
        </div>
      );
    }

    const { children } = this.props;
    return children;
  }
}
