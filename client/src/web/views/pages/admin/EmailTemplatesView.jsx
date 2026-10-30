import { PureComponent } from 'react';
import AdminHeader from '../../components/AdminHeader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const FIELDS = [
  { key: 'subject', label: 'Objet du courriel' },
  { key: 'heading', label: 'Titre affiché' },
];

/** Modèles de courriel : liste, édition, aperçu réel, test et envoi d'une news. */
export default class EmailTemplatesView extends PureComponent {
  field = (key) => (e) => this.props.onChange(key, e.target.value);

  renderList() {
    const { templates, selectedKey, onSelect } = this.props;
    const groups = [...new Set(templates.map((t) => t.group))];
    return (
      <nav className="pf-col" aria-label="Modèles de courriel">
        {groups.map((group) => (
          <div key={group} className="pf-col" style={{ gap: 6 }}>
            <span className="pf-mono">{group}</span>
            {templates
              .filter((t) => t.group === group)
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`pf-chip pf-tpl${selectedKey === t.key ? ' is-on' : ''}`}
                  aria-pressed={selectedKey === t.key}
                  onClick={() => onSelect(t.key)}
                >
                  {t.label}
                  {t.customized ? ' •' : ''}
                </button>
              ))}
          </div>
        ))}
      </nav>
    );
  }

  render() {
    const {
      template,
      values,
      preview,
      testTo,
      subscribers,
      busy,
      error,
      notice,
      confirming,
      onSave,
      onReset,
      onTestTo,
      onTest,
      onAskBroadcast,
      onConfirmBroadcast,
      onCancelBroadcast,
    } = this.props;
    return (
      <section className="pf-col" style={{ gap: 24 }}>
        <AdminHeader title="Courriels" />
        {error ? (
          <p className="pf-error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="pf-lime" role="status" style={{ margin: 0 }}>
            {notice}
          </p>
        ) : null}
        <div className="pf-mail">
          {this.renderList()}
          {template ? (
            <div className="pf-col">
              <h2 className="pf-h3">{template.label}</h2>
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`tpl-${f.key}`} className="pf-label">
                    {f.label}
                  </label>
                  <input
                    id={`tpl-${f.key}`}
                    className="pf-input"
                    value={values[f.key]}
                    onChange={this.field(f.key)}
                  />
                </div>
              ))}
              <div>
                <label htmlFor="tpl-body" className="pf-label">
                  Texte (une ligne vide sépare deux paragraphes)
                </label>
                <textarea
                  id="tpl-body"
                  className="pf-input"
                  rows="8"
                  value={values.body}
                  onChange={this.field('body')}
                />
                <small className="pf-mu">
                  Variables :{' '}
                  {template.variables.map((v) => (
                    <code key={v} className="pf-k" style={{ marginRight: 4 }}>
                      {`{{${v}}}`}
                    </code>
                  ))}
                </small>
              </div>
              <div>
                <label htmlFor="tpl-cta" className="pf-label">
                  Texte du bouton (vide : aucun bouton)
                </label>
                <input
                  id="tpl-cta"
                  className="pf-input"
                  value={values.ctaLabel}
                  onChange={this.field('ctaLabel')}
                />
              </div>
              {template.key === 'news' ? (
                <div>
                  <label htmlFor="tpl-url" className="pf-label">
                    Lien du bouton
                  </label>
                  <input
                    id="tpl-url"
                    className="pf-input"
                    placeholder="https://…"
                    value={values.ctaUrl}
                    onChange={this.field('ctaUrl')}
                  />
                </div>
              ) : null}
              <div className="pf-row">
                <button
                  type="button"
                  className="pf-btn pf-btn--pri"
                  onClick={onSave}
                  disabled={busy}
                >
                  Enregistrer
                </button>
                {template.customized ? (
                  <button
                    type="button"
                    className="pf-btn"
                    onClick={onReset}
                    disabled={busy}
                  >
                    Rétablir le modèle par défaut
                  </button>
                ) : null}
              </div>
              <div className="pf-row" style={{ flexWrap: 'nowrap' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="tpl-test" className="visually-hidden">
                    Adresse pour le courriel de test
                  </label>
                  <input
                    id="tpl-test"
                    type="email"
                    className="pf-input"
                    placeholder="Adresse pour le courriel de test"
                    value={testTo}
                    onChange={(e) => onTestTo(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="pf-btn"
                  onClick={onTest}
                  disabled={busy || !testTo}
                >
                  Envoyer un test
                </button>
              </div>
              {template.key === 'news' ? (
                <button
                  type="button"
                  className="pf-btn pf-btn--pri"
                  onClick={onAskBroadcast}
                  disabled={busy}
                >
                  Envoyer à tous les abonnés
                </button>
              ) : null}
            </div>
          ) : (
            <p className="pf-mu">Chargement…</p>
          )}
          <div className="pf-col">
            <span className="pf-mono pf-lime">Aperçu</span>
            {preview ? (
              <>
                <span className="pf-mu">Objet : {preview.subject}</span>
                <iframe
                  title="Aperçu du courriel"
                  className="pf-mail__preview"
                  sandbox=""
                  srcDoc={preview.html}
                />
              </>
            ) : null}
          </div>
        </div>
        {confirming ? (
          <ConfirmModal
            title="Envoyer la news"
            message={`Envoyer ce courriel à ${subscribers} abonné(s) confirmé(s) ? L’envoi ne peut pas être annulé.`}
            confirmLabel="Envoyer"
            onConfirm={onConfirmBroadcast}
            onCancel={onCancelBroadcast}
          />
        ) : null}
      </section>
    );
  }
}
