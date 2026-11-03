import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import { reportarError } from './reportarError';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Errores de render de React: no llegan a window.onerror, se reportan acá.
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    reportarError(error.message, `${error.stack ?? ''}\n\nComponentes:${info.componentStack ?? ''}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Ocurrió un error inesperado"
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Recargar
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
