import { Component, createRef } from 'react';

const EVENTS = ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'];

/**
 * HOC (addendum E.6) : empêche la copie, le clic droit, le glisser-déposer et la sélection
 * sur les pages de contenu. Les champs de formulaire restent utilisables.
 *
 * Limites honnêtes : le code source, les outils du navigateur, le mode lecture et la capture
 * d'écran contournent ces protections. C'est de la dissuasion, pas une sécurité.
 * Accessibilité : user-select: none n'empêche pas les lecteurs d'écran ; la navigation au
 * clavier n'est jamais bloquée.
 */
export default function withContentProtection(Wrapped) {
  return class Protected extends Component {
    static displayName = `withContentProtection(${Wrapped.displayName || Wrapped.name || 'Component'})`;

    rootRef = createRef();

    isEditable = (el) =>
      el && el.closest && el.closest('input, textarea, [contenteditable=true]');

    block = (e) => {
      if (!this.isEditable(e.target)) e.preventDefault();
    };

    componentDidMount() {
      EVENTS.forEach((t) => this.rootRef.current.addEventListener(t, this.block));
    }

    componentWillUnmount() {
      EVENTS.forEach((t) => this.rootRef.current.removeEventListener(t, this.block));
    }

    render() {
      return (
        <div ref={this.rootRef} className="protected-content">
          <Wrapped {...this.props} />
        </div>
      );
    }
  };
}
