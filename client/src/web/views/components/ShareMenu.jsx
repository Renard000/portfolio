import { Component, createRef } from 'react';
import withLocale from '../../context/withLocale.jsx';

/** Menu de partage : ne dépend pas de la fenêtre système, peu fiable sur ordinateur. */
class ShareMenu extends Component {
  state = { open: false };
  rootRef = createRef();

  componentDidMount() {
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('mousedown', this.onOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('mousedown', this.onOutside);
  }

  onKey = (e) => {
    if (e.key === 'Escape') this.setState({ open: false });
  };

  onOutside = (e) => {
    if (this.rootRef.current && !this.rootRef.current.contains(e.target))
      this.setState({ open: false });
  };

  toggle = () => this.setState((s) => ({ open: !s.open }));

  render() {
    const { url, links, copied, onCopy } = this.props;
    return (
      <div className="pf-share" ref={this.rootRef}>
        <button
          type="button"
          className="pf-btn pf-round"
          aria-label={this.props.t('Partager')}
          aria-expanded={this.state.open}
          onClick={this.toggle}
        >
          ↗
        </button>
        {this.state.open ? (
          <div
            className="pf-share__menu"
            role="group"
            aria-label={this.props.t('Partager cet article')}
          >
            <label className="pf-mono" htmlFor="share-url">
              {this.props.t('Lien de l’article')}
            </label>
            <input id="share-url" className="pf-input" readOnly value={url} />
            <button type="button" className="pf-btn pf-btn--pri" onClick={onCopy}>
              {copied ? this.props.t('Lien copié') : this.props.t('Copier le lien')}
            </button>
            {links.map((l) => (
              <a
                key={l.label}
                className="pf-btn"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {this.props.t(l.label)}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}
ShareMenu.defaultProps = { links: [] };

export default withLocale(ShareMenu);
