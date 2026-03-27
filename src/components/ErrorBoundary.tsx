import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
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

  public render() {
    if (this.state.hasError) {
      let errorMsg = this.state.error?.message || 'Une erreur inattendue est survenue.';
      let isFirestoreError = false;

      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed.operationType) {
          isFirestoreError = true;
          errorMsg = `Erreur de base de données (${parsed.operationType} sur ${parsed.path}): ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h1>
            <p className="text-gray-600 mb-6">
              {isFirestoreError 
                ? "Un problème est survenu lors de la communication avec le serveur. Vérifiez vos permissions ou votre connexion." 
                : "L'application a rencontré un problème inattendu."}
            </p>
            <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm text-left overflow-auto max-h-40 mb-6 font-mono">
              {errorMsg}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors w-full"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
