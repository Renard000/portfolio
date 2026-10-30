import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader.jsx';

/**
 * Éditeur d'article (maquette A-04) : Markdown à gauche, aperçu en direct à droite.
 * Composant contrôlé : les valeurs et l'aperçu (déjà assaini) viennent du contrôleur.
 */
export default class ArticleEditorView extends PureComponent {
  field = (key) => (e) => this.props.onChange(key, e.target.value);

  render() {
    const {
      values,
      previewHtml,
      categories,
      published,
      saving,
      error,
      notice,
      coverName,
      onSaveDraft,
      onPublish,
      onUnpublish,
      onCover,
    } = this.props;
    return (
      <form
        className="pf-col"
        style={{ gap: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSaveDraft();
        }}
        noValidate
      >
        <AdminHeader title="Éditeur d’article">
          <Link className="pf-btn" to="/admin/articles">
            Retour
          </Link>
          {published ? (
            <>
              <button
                type="button"
                className="pf-btn"
                onClick={onUnpublish}
                disabled={saving}
              >
                Dépublier
              </button>
              <button type="submit" className="pf-btn pf-btn--pri" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="pf-btn" disabled={saving}>
                Enregistrer le brouillon
              </button>
              <button
                type="button"
                className="pf-btn pf-btn--pri"
                onClick={onPublish}
                disabled={saving}
              >
                Publier et notifier →
              </button>
            </>
          )}
        </AdminHeader>
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

        <div className="pf-editor">
          <div className="pf-col">
            <div>
              <label htmlFor="ed-title" className="visually-hidden">
                Titre de l’article
              </label>
              <input
                id="ed-title"
                className="pf-input"
                placeholder="Titre de l’article"
                value={values.title}
                onChange={this.field('title')}
                required
              />
            </div>
            <div className="pf-row" style={{ flexWrap: 'nowrap' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="ed-slug" className="visually-hidden">
                  Slug
                </label>
                <input
                  id="ed-slug"
                  className="pf-input"
                  placeholder="slug-de-l-article"
                  value={values.slug}
                  onChange={this.field('slug')}
                  required
                />
              </div>
              <div style={{ width: 200 }}>
                <label htmlFor="ed-category" className="visually-hidden">
                  Catégorie
                </label>
                <input
                  id="ed-category"
                  className="pf-input"
                  placeholder="Catégorie"
                  list="ed-categories"
                  value={values.category}
                  onChange={this.field('category')}
                />
                <datalist id="ed-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
            <div>
              <label htmlFor="ed-excerpt" className="visually-hidden">
                Extrait
              </label>
              <input
                id="ed-excerpt"
                className="pf-input"
                placeholder="Extrait (résumé en deux lignes)"
                maxLength={500}
                value={values.excerpt}
                onChange={this.field('excerpt')}
              />
            </div>
            <div>
              <label htmlFor="ed-content" className="visually-hidden">
                Contenu en Markdown
              </label>
              <textarea
                id="ed-content"
                className="pf-input"
                placeholder={'# Titre\nTexte en **Markdown**…'}
                value={values.content}
                onChange={this.field('content')}
                spellCheck
              />
            </div>
            <div>
              <label htmlFor="ed-tags" className="visually-hidden">
                Étiquettes
              </label>
              <input
                id="ed-tags"
                className="pf-input"
                placeholder="Étiquettes, séparées par des virgules"
                value={values.tags}
                onChange={this.field('tags')}
              />
            </div>
            <div className="pf-row" style={{ flexWrap: 'nowrap' }}>
              <label
                htmlFor="ed-cover"
                className="pf-mono"
                style={{ whiteSpace: 'nowrap' }}
              >
                Image de couverture
              </label>
              <input
                id="ed-cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="pf-input"
                style={{ flex: 1 }}
                onChange={(e) => onCover(e.target.files[0] || null)}
              />
            </div>
            {coverName ? <span className="pf-mono">Couverture : {coverName}</span> : null}
          </div>

          <div className="pf-card pf-col" style={{ minHeight: 560 }} aria-live="polite">
            <span className="pf-mono pf-lime">Aperçu en direct</span>
            <h2 className="pf-h2" style={{ fontSize: 36 }}>
              {values.title || 'Titre'}
            </h2>
            <div
              className="pf-prose"
              // Aperçu assaini par DOMPurify (MarkdownService) avant d'arriver ici
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </form>
    );
  }
}
ArticleEditorView.defaultProps = { categories: [] };
