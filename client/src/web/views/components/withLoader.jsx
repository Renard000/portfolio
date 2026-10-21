import { Component } from 'react';

/**
 * HOC : affiche un chargement / une erreur à la place du composant enveloppé.
 * Props lues : loading, error, hasData (le chargement n'écrase pas des données déjà là).
 */
export default function withLoader(Wrapped) {
  return class WithLoader extends Component {
    static displayName = `withLoader(${Wrapped.displayName || Wrapped.name || 'Component'})`;

    render() {
      const { loading, error, hasData } = this.props;
      if (loading && !hasData)
        return (
          <div className="text-center py-5" role="status">
            <div className="spinner-border" aria-hidden="true" />
            <p className="text-muted mt-2">Chargement…</p>
          </div>
        );
      if (error && !hasData)
        return (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        );
      return <Wrapped {...this.props} />;
    }
  };
}
