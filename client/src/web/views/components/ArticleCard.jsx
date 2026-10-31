import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import NewBadge from './NewBadge.jsx';
import Thumb from './Thumb.jsx';
import withLocale from '../../context/withLocale.jsx';

/** Carte d'article (maquette P-04) : reçoit un modèle déjà formaté. */
class ArticleCard extends PureComponent {
  render() {
    const { card, height } = this.props;
    return (
      <Link
        to={`/blog/${card.slug}`}
        className="pf-card"
        style={{ padding: 14, height: '100%' }}
        aria-label={this.props.t('Lire l’article {title}', { title: card.title })}
      >
        <NewBadge path={`/blog/${card.slug}`} />
        <Thumb
          color={card.color}
          kind={card.kind}
          height={height}
          imageUrl={card.coverUrl}
        />
        <div className="pf-col" style={{ gap: 10, padding: '16px 10px 8px' }}>
          <div className="pf-row pf-between">
            {card.category ? <span className="pf-chip">{card.category}</span> : <span />}
            <span className="pf-mono">
              {card.date} · {card.minutes} {this.props.t('min')}
            </span>
          </div>
          <h3 className="pf-h3" style={{ fontSize: 22 }}>
            {card.title}
          </h3>
          {card.excerpt ? (
            <p className="pf-mu" style={{ margin: 0 }}>
              {card.excerpt}
            </p>
          ) : null}
          <div className="pf-row pf-mono" style={{ gap: 18 }}>
            <span title={this.props.t('J’aime')}>♥ {card.likes}</span>
            <span title={this.props.t('Vues')}>◉ {card.views}</span>
            <span title={this.props.t('Commentaires')}>✎ {card.comments}</span>
          </div>
        </div>
      </Link>
    );
  }
}
ArticleCard.defaultProps = { height: 190 };

export default withLocale(ArticleCard);
