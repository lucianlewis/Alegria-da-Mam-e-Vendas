import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

const ErrorUI: React.FC<{ errorMessage: string }> = ({ errorMessage }) => {
  const { t } = useLanguage();
  
  let displayMessage = t('somethingWentWrong');
  try {
    const parsed = JSON.parse(errorMessage);
    if (parsed.error) {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        displayMessage = t('permissionDenied');
      } else {
        displayMessage = `${t('error')}: ${parsed.error}`;
      }
    }
  } catch (e) {
    displayMessage = errorMessage;
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-rose-500 mb-4">{t('applicationError')}</h2>
      <p className="text-slate-400 mb-8">{displayMessage}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary text-white px-6 py-2 rounded-xl font-bold"
      >
        {t('reloadApplication')}
      </button>
    </div>
  );
};

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
      return <ErrorUI errorMessage={this.state.errorMessage} />;
    }

    const { children } = this.props;
    return children;
  }
}
