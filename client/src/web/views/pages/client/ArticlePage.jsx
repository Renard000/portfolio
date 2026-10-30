import { Component, createRef } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from '../../components/ArticleCard.jsx';
import CommentForm from '../../components/CommentForm.jsx';
import Thumb from '../../components/Thumb.jsx';

/**
 * Article (maquette P-05) : barre de lecture, likes, contenu Markdown déjà assaini,
 * bouton « Copier » sur chaque bloc de code, commentaires et « À lire ensuite ».
 */
export default class ArticlePage extends Component {
  bodyRef = createRef();
  state = { progress: 0 };

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.addCopyButtons();
  }

  componentDidUpdate(prev) {
    if (prev.article.html !== this.props.article.html) this.addCopyButtons();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll = () => {
    const el = this.bodyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    this.setState({ progress: Math.round(done * 100) });
  };

  /** Ajoute un bouton « Copier » à chaque <pre> du contenu rendu. */
  addCopyButtons() {
    const el = this.bodyRef.current;
    if (!el) return;
    el.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.pf-copy')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pf-copy';
      btn.textContent = 'Copier';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code') || pre;
        const done = () => {
          btn.textContent = 'Copié';
          setTimeout(() => (btn.textContent = 'Copier'), 1500);
        };
        if (navigator.clipboard)
          navigator.clipboard.writeText(code.textContent).then(done);
      });
      pre.appendChild(btn);
    });
  }

  render() {
    const {
      article,
      comments,
      related,
      liked,
      shareLabel,
      commentStatus,
      commentError,
      onLike,
      onShare,
      onComment,
    } = this.props;
    return (
      <>
        <div
          className="pf-read-progress"
          role="progressbar"
          aria-label="Progression de la lecture"
          aria-valuenow={this.state.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ '--w': `${this.state.progress}%` }} />
        </div>
        <main>
          <header
            className="pf-wrap"
            style={{ maxWidth: 900, paddingTop: 'clamp(48px,7vw,80px)' }}
          >
            <div className="pf-row">
              {article.category ? (
                <span className="pf-chip is-on">{article.category}</span>
              ) : null}
              <span className="pf-mono">
                {article.date} · {article.minutes} min · ◉ {article.views} vues
              </span>
            </div>
            <h1
              className="pf-h1 pf-rise"
              style={{ fontSize: 'clamp(2.4rem,6vw,4.75rem)', margin: '24px 0' }}
            >
              {article.title}
            </h1>
            <div style={{ marginTop: 40 }}>
              <Thumb
                color={article.color}
                kind={0}
                height={420}
                imageUrl={article.coverUrl}
                alt=""
              />
            </div>
          </header>

          <div
            className="pf-wrap pf-article-grid"
            style={{ maxWidth: 900, paddingTop: 56 }}
            ref={this.bodyRef}
          >
            <div className="pf-col pf-article-aside">
              <button
                type="button"
                className={`pf-btn pf-round${liked ? '' : ' pf-btn--pri'}`}
                onClick={onLike}
                disabled={liked}
                aria-label={liked ? 'Vous aimez cet article' : 'J’aime'}
              >
                ♥
              </button>
              <b aria-label={`${article.likes} j’aime`}>{article.likes}</b>
              <button
                type="button"
                className="pf-btn pf-round"
                onClick={onShare}
                aria-label="Partager"
                title={shareLabel || 'Partager'}
              >
                ↗
              </button>
              {shareLabel ? (
                <span className="pf-mono" role="status">
                  {shareLabel}
                </span>
              ) : null}
            </div>
            <article
              className="pf-prose"
              // Contenu assaini par DOMPurify dans la BLL (MarkdownService)
              dangerouslySetInnerHTML={{ __html: article.html }}
            />
          </div>

          <section className="pf-wrap" style={{ maxWidth: 900, paddingTop: 80 }}>
            <h2 className="pf-h2" style={{ fontSize: 40, marginBottom: 24 }}>
              Commentaires ({comments.length})
            </h2>
            <CommentForm
              key={article.id}
              status={commentStatus}
              error={commentError}
              onSubmit={onComment}
            />
            <div className="pf-col" style={{ marginTop: 24 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="pf-card pf-col"
                  style={{ padding: 20, gap: 6 }}
                >
                  <div className="pf-row pf-between">
                    <b>{c.author}</b>
                    <span className="pf-mono">{c.when}</span>
                  </div>
                  <span className="pf-mu" style={{ whiteSpace: 'pre-line' }}>
                    {c.content}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {related.length ? (
            <section className="pf-wrap pf-sec">
              <div className="pf-row pf-between" style={{ marginBottom: 20 }}>
                <h2 className="pf-h3">À lire ensuite</h2>
                <Link to="/blog">Tous les articles →</Link>
              </div>
              <div className="pf-grid3">
                {related.map((card) => (
                  <ArticleCard key={card.id} card={card} />
                ))}
              </div>
            </section>
          ) : null}
        </main>
      </>
    );
  }
}
ArticlePage.defaultProps = { comments: [], related: [] };
