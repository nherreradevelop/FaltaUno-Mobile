import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  alternativa: (reintentar: () => void) => ReactNode;
}
/** CU09 H01: última barrera para errores de render, además de validar el contrato en el adaptador. */
export class LimiteDeError extends Component<Props, { fallo: boolean }> {
  override state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  override render() {
    if (this.state.fallo) return this.props.alternativa(() => this.setState({ fallo: false }));
    return this.props.children;
  }
}
