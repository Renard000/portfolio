import { Component } from 'react';

/** Isole une section : une erreur de rendu n'écroule pas toute la page. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Erreur de rendu :', error);
  }

  retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="alert alert-warning" role="alert">
        {this.props.message || 'Cette section ne peut pas être affichée.'}{' '}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={this.retry}
        >
          Réessayer
        </button>
      </div>
    );
  }
}
