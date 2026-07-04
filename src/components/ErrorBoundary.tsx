import React from "react";

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura erros de render em qualquer lugar da árvore e mostra uma tela de
 * recuperação em vez de uma página em branco. Também loga o erro no console.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center rounded-2xl border border-border/70 bg-card p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive text-2xl">
            !
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            Algo deu errado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tivemos um problema ao carregar esta tela. Tente recarregar — se
            continuar, avise o suporte.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-all active:scale-[0.97]"
          >
            Recarregar
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left text-[11px] text-muted-foreground">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
