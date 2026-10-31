import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { fetchArticle, likeArticle, postComment } from '../store/slices/articlesSlice.js';
import ArticleService from '../../bll/services/ArticleService.js';
import MarkdownService from '../../bll/services/MarkdownService.js';
import ArticlePage from '../views/pages/client/ArticlePage.jsx';
import NotFoundPage from '../views/pages/client/NotFoundPage.jsx';
import withLocale from '../context/withLocale.jsx';

class ArticleDetailController extends Component {
  state = { copied: false };

  componentDidMount() {
    this.props.fetchArticle(this.props.match.params.slug);
  }

  componentDidUpdate(prev) {
    // « À lire ensuite » : même composant, autre article
    if (prev.match.params.slug !== this.props.match.params.slug) {
      this.setState({ copied: false });
      this.props.fetchArticle(this.props.match.params.slug);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.shareTimer);
  }

  like = () => this.props.likeArticle(this.props.data.article.id);

  /** En cas de refus du navigateur, l'adresse reste affichée et sélectionnable. */
  copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.setState({ copied: true });
      clearTimeout(this.shareTimer);
      this.shareTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      document.getElementById('share-url')?.select();
    }
  };

  comment = (dto) => this.props.postComment({ id: this.props.data.article.id, ...dto });

  /** Le rendu Markdown n'est refait que si le texte change (pas à chaque like). */
  renderMarkdown(content) {
    if (content !== this.lastContent) {
      this.lastContent = content;
      this.lastHtml = MarkdownService.render(content);
    }
    return this.lastHtml;
  }

  render() {
    const { data, loading, error, liked, commentStatus, commentError, locale } =
      this.props;
    if (error && !loading) return <NotFoundPage />;
    if (!data || data.article.slug !== this.props.match.params.slug)
      return (
        <p className="pf-wrap pf-mu" role="status" style={{ paddingTop: 80 }}>
          {this.props.t('Chargement…')}
        </p>
      );
    const a = data.article;
    const article = {
      ...ArticleService.toCard(a, 0, locale),
      date: ArticleService.formatDate(a.publishedAt, true, locale),
      views: ArticleService.thousands(a.views, locale),
      html: this.renderMarkdown(a.content),
    };
    const now = new Date();
    return (
      <ArticlePage
        article={article}
        comments={data.comments.map((c) => ({
          ...c,
          when: ArticleService.relative(c.createdAt, now, locale),
        }))}
        related={data.related.map((r, i) => ArticleService.toCard(r, i + 1, locale))}
        liked={liked}
        shareUrl={window.location.href}
        shareLinks={ArticleService.shareLinks(window.location.href, a.title)}
        copied={this.state.copied}
        commentStatus={commentStatus}
        commentError={commentError}
        onLike={this.like}
        onCopyLink={this.copyLink}
        onComment={this.comment}
      />
    );
  }
}

const mapState = (s) => ({
  data: s.articles.current,
  locale: s.content.locale,
  loading: s.articles.currentLoading,
  error: s.articles.currentError,
  liked: s.articles.liked,
  commentStatus: s.articles.commentStatus,
  commentError: s.articles.commentError,
});
export default withRouter(
  connect(mapState, { fetchArticle, likeArticle, postComment })(
    withLocale(ArticleDetailController)
  )
);
