import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirebaseError = true;
            errorMessage = `Erro de permissão no Firebase (${parsed.operationType} em ${parsed.path}). Verifique suas regras de segurança.`;
          }
        }
      } catch (e) {
        // Not a JSON error, use default or the error message itself
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="size-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Ops! Algo deu errado</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {isFirebaseError && (
              <div className="bg-black/20 rounded-xl p-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Detalhes Técnicos</p>
                <code className="text-xs text-rose-400 break-all">
                  {this.state.error?.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
