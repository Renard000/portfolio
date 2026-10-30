import { PureComponent } from 'react';
import AdminHeader from '../../components/AdminHeader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

/** Modération des commentaires et messages de contact (maquette A-05). */
export default class ModerationView extends PureComponent {
  tabs(group, items, current, onChange) {
    return (
      <div className="pf-row" role="group" aria-label={group}>
        {items.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`pf-chip${current === t.key ? ' is-on' : ''}`}
            aria-pressed={current === t.key}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  renderComment(c) {
    const { onApprove, onUnapprove, onAskDelete } = this.props;
    return (
      <article key={c.id} className="pf-card pf-col" style={{ gap: 8 }}>
        <div className="pf-row pf-between">
          <b>{c.author}</b>
          <span className="pf-mono">
            sur « {c.articleTitle} » · {c.when}
          </span>
        </div>
        <span className="pf-mu" style={{ whiteSpace: 'pre-line' }}>
          {c.content}
        </span>
        <div className="pf-row">
          {c.approved ? (
            <button
              type="button"
              className="pf-btn"
              style={{ minHeight: 40 }}
              onClick={() => onUnapprove(c)}
            >
              Retirer
            </button>
          ) : (
            <button
              type="button"
              className="pf-btn pf-btn--pri"
              style={{ minHeight: 40 }}
              onClick={() => onApprove(c)}
            >
              Approuver
            </button>
          )}
          <button
            type="button"
            className="pf-btn"
            style={{ minHeight: 40 }}
            onClick={() => onAskDelete('comment', c)}
            aria-label={`Supprimer le commentaire de ${c.author}`}
          >
            Supprimer
          </button>
        </div>
      </article>
    );
  }

  renderMessage(m) {
    const { onMarkRead, onAskDelete } = this.props;
    return (
      <article
        key={m.id}
        className={`pf-card pf-col${m.lu ? '' : ' pf-card--new'}`}
        style={{ gap: 8 }}
      >
        <div className="pf-row pf-between">
          <b>
            {m.nom} · {m.email}
          </b>
          {m.lu ? (
            <span className="pf-mono">{m.when}</span>
          ) : (
            <span className="pf-bd">Nouveau</span>
          )}
        </div>
        {m.sujet ? <b>{m.sujet}</b> : null}
        <span className="pf-mu" style={{ whiteSpace: 'pre-line' }}>
          {m.message}
        </span>
        <div className="pf-row">
          <a className="pf-btn pf-btn--pri" style={{ minHeight: 40 }} href={m.replyHref}>
            Répondre
          </a>
          <button
            type="button"
            className="pf-btn"
            style={{ minHeight: 40 }}
            onClick={() => onMarkRead(m)}
          >
            {m.lu ? 'Marquer comme non lu' : 'Marquer comme lu'}
          </button>
          <button
            type="button"
            className="pf-btn"
            style={{ minHeight: 40 }}
            onClick={() => onAskDelete('message', m)}
            aria-label={`Supprimer le message de ${m.nom}`}
          >
            Supprimer
          </button>
        </div>
      </article>
    );
  }

  render() {
    const {
      comments,
      messages,
      commentTabs,
      messageTabs,
      commentTab,
      messageTab,
      loading,
      error,
      deleting,
      onCommentTab,
      onMessageTab,
      onConfirmDelete,
      onCancelDelete,
    } = this.props;
    return (
      <section className="pf-col" style={{ gap: 24 }}>
        <AdminHeader title="Modération et messages" />
        {error ? (
          <p className="pf-error" role="alert">
            {error}
          </p>
        ) : null}
        {loading && !comments.length && !messages.length ? (
          <p className="pf-mu" role="status">
            Chargement…
          </p>
        ) : null}
        <div className="pf-grid2" style={{ alignItems: 'start' }}>
          <section className="pf-col" aria-labelledby="mod-comments">
            <h2 id="mod-comments" className="visually-hidden">
              Commentaires
            </h2>
            {this.tabs('Commentaires', commentTabs, commentTab, onCommentTab)}
            {comments.map((c) => this.renderComment(c))}
            {!comments.length ? <p className="pf-mu">Aucun commentaire.</p> : null}
          </section>
          <section className="pf-col" aria-labelledby="mod-messages">
            <h2 id="mod-messages" className="visually-hidden">
              Messages
            </h2>
            {this.tabs('Messages', messageTabs, messageTab, onMessageTab)}
            {messages.map((m) => this.renderMessage(m))}
            {!messages.length ? <p className="pf-mu">Aucun message.</p> : null}
          </section>
        </div>
        {deleting ? (
          <ConfirmModal
            title="Confirmer la suppression"
            message={
              deleting.kind === 'comment'
                ? `Supprimer le commentaire de ${deleting.item.author} ? Cette action est définitive.`
                : `Supprimer le message de ${deleting.item.nom} ? Cette action est définitive.`
            }
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : null}
      </section>
    );
  }
}
