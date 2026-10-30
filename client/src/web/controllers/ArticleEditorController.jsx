import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  fetchAdminArticle,
  fetchAdminArticles,
  saveArticle,
  setArticlePublished,
  clearCurrentArticle,
} from '../store/slices/adminArticlesSlice.js';
import { uploadAsset } from '../store/thunks/uploadAsset.js';
import ArticleService from '../../bll/services/ArticleService.js';
import MarkdownService from '../../bll/services/MarkdownService.js';
import ArticleEditorView from '../views/pages/admin/ArticleEditorView.jsx';

const EMPTY = {
  title: '',
  slug: '',
  category: '',
  excerpt: '',
  content: '',
  tags: '',
  coverUrl: '',
};
const PREVIEW_DELAY = 150;

const fromArticle = (a) => ({
  title: a.title || '',
  slug: a.slug || '',
  category: a.category || '',
  excerpt: a.excerpt || '',
  content: a.content || '',
  tags: (a.tags || []).join(', '),
  coverUrl: a.coverUrl || '',
});

/** /admin/articles/nouveau ou /admin/articles/:id */
class ArticleEditorController extends Component {
  constructor(props) {
    super(props);
    this.state = {
      values: { ...EMPTY },
      // Le slug suit le titre tant que l'utilisateur ne l'a pas modifié lui-même
      slugTouched: false,
      previewHtml: '',
      coverFile: null,
      error: null,
      notice: null,
      loadedId: null,
    };
  }

  get id() {
    const { id } = this.props.match.params;
    return id && id !== 'nouveau' ? id : null;
  }

  componentDidMount() {
    this.props.clearCurrentArticle();
    if (this.id) this.props.fetchAdminArticle(this.id);
    if (!this.props.items.length) this.props.fetchAdminArticles();
  }

  componentDidUpdate() {
    const { current } = this.props;
    // Chargement de l'article à modifier : on remplit le formulaire une seule fois
    if (
      this.id &&
      current &&
      current.id === this.id &&
      this.state.loadedId !== current.id
    ) {
      const values = fromArticle(current);
      this.setState({
        values,
        slugTouched: true,
        loadedId: current.id,
        previewHtml: MarkdownService.render(values.content),
      });
    }
  }

  componentWillUnmount() {
    clearTimeout(this.previewTimer);
  }

  change = (key, value) => {
    this.setState((s) => {
      const values = { ...s.values, [key]: value };
      if (key === 'title' && !s.slugTouched) values.slug = ArticleService.slugify(value);
      return { values, slugTouched: s.slugTouched || key === 'slug', notice: null };
    });
    if (key === 'content') {
      // Aperçu assaini, recalculé après une courte pause de frappe
      clearTimeout(this.previewTimer);
      this.previewTimer = setTimeout(
        () =>
          this.setState((s) => ({
            previewHtml: MarkdownService.render(s.values.content),
          })),
        PREVIEW_DELAY
      );
    }
  };

  setCover = (file) => this.setState({ coverFile: file });

  async save({ publish }) {
    const invalid = ArticleService.validate(this.state.values);
    if (invalid) return this.setState({ error: invalid, notice: null });
    this.setState({ error: null, notice: null });
    try {
      const urls = {};
      if (this.state.coverFile)
        urls.coverUrl = await this.props
          .uploadAsset({ file: this.state.coverFile, kind: 'image', folder: 'articles' })
          .unwrap();
      const dto = ArticleService.toDto(this.state.values, urls);
      const saved = await this.props.saveArticle({ id: this.id, dto, publish }).unwrap();
      this.setState({
        coverFile: null,
        values: { ...this.state.values, coverUrl: saved.coverUrl || '' },
        notice: publish
          ? 'Article publié : les abonnés sont notifiés.'
          : 'Brouillon enregistré.',
      });
      // Nouvel article : on passe sur son adresse d'édition
      if (!this.id) this.props.history.replace(`/admin/articles/${saved.id}`);
    } catch (err) {
      this.setState({ error: err.message });
    }
  }

  saveDraft = () => this.save({ publish: false });
  publish = () => this.save({ publish: true });
  unpublish = async () => {
    try {
      await this.props.setArticlePublished({ id: this.id, published: false }).unwrap();
      this.setState({ notice: 'Article retiré du blog (brouillon).' });
    } catch (err) {
      this.setState({ error: err.message });
    }
  };

  render() {
    const { current, saving, saveError, items } = this.props;
    if (this.id && !this.state.loadedId && !saveError)
      return (
        <p className="pf-mu" role="status">
          Chargement…
        </p>
      );
    const categories = [...new Set(items.map((a) => a.category).filter(Boolean))];
    const published = Boolean(this.id && current && current.status === 'published');
    return (
      <ArticleEditorView
        values={this.state.values}
        previewHtml={this.state.previewHtml}
        categories={categories}
        published={published}
        saving={saving}
        error={this.state.error || saveError}
        notice={this.state.notice}
        coverName={
          this.state.coverFile
            ? this.state.coverFile.name
            : this.state.values.coverUrl
              ? this.state.values.coverUrl.split('/').pop()
              : null
        }
        onChange={this.change}
        onSaveDraft={this.saveDraft}
        onPublish={this.publish}
        onUnpublish={this.unpublish}
        onCover={this.setCover}
      />
    );
  }
}

const mapState = (s) => ({
  current: s.adminArticles.current,
  items: s.adminArticles.items,
  saving: s.adminArticles.saving,
  saveError: s.adminArticles.saveError,
});
export default withRouter(
  connect(mapState, {
    fetchAdminArticle,
    fetchAdminArticles,
    saveArticle,
    setArticlePublished,
    clearCurrentArticle,
    uploadAsset,
  })(ArticleEditorController)
);
