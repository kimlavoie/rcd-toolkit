'use client'

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="alert alert-danger m-3 p-4 shadow-sm rounded" role="alert">
            <h4 className="alert-heading border-bottom pb-2">💥 Une erreur inattendue est survenue</h4>
            <p className="mb-2 mt-3">L'interface a rencontré un problème lors de l'affichage.</p>
            <pre className="bg-dark text-light p-3 rounded small overflow-auto" style={{maxHeight: '200px'}}>
                {this.state.error?.message || "Erreur inconnue"}
            </pre>
            <button 
                className="btn btn-outline-danger mt-3 fw-bold rounded-pill px-4" 
                onClick={() => this.setState({ hasError: false, error: null })}
            >
                ↻ Réessayer
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
