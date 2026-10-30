import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { fetchArticle, likeArticle, postComment } from '../store/slices/articlesSlice.js';
import ArticleService from '../../bll/services/ArticleService.js';
import MarkdownService from '../../bll/services/MarkdownService.js';
import ArticlePage from '../views/pages/client/ArticlePage.jsx';
import NotFoundPage from '../views/pages/client/NotFoundPage.jsx';

class ArticleDetailController extends Component {
  state = { shareLabel: null };

  componentDidMount() {
    this.props.fetchArticle(this.props.match.params.slug);
  }

  componentDidUpdate(prev) {
    // « À lire ensuite » : même composant, autre article
    if (prev.match.params.slug !== this.props.match.params.slug) {
      this.setState({ shareLabel: null });
      this.props.fetchArticle(this.props.match.params.slug);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.shareTimer);
  }

  like = () => this.props.likeArticle(this.props.data.article.id);

  share = async () => {
    const url = window.location.href;
    const title = this.props.data.article.title;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        this.flash('Lien copié');
      }
    } catch {
      // Partage annulé par l'utilisateur : rien à faire
    }
  };

  flash(label) {
    this.setState({ shareLabel: label });
    clearTimeout(this.shareTimer);
    this.shareTimer = setTimeout(() => this.setState({ shareLabel: null }), 2000);
  }

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
    const { data, loading, error, liked, commentStatus, commentError } = this.props;
    if (error && !loading) return <NotFoundPage />;
    if (!data || data.article.slug !== this.props.match.params.slug)
      return (
        <p className="pf-wrap pf-mu" role="status" style={{ paddingTop: 80 }}>
          Chargement…
        </p>
      );
    const a = data.article;
    const article = {
      ...ArticleService.toCard(a),
      date: ArticleService.formatDate(a.publishedAt),
      views: ArticleService.thousands(a.views),
      html: this.renderMarkdown(a.content),
    };
    const now = new Date();
    return (
      <ArticlePage
        article={article}
        comments={data.comments.map((c) => ({
          ...c,
          when: ArticleService.relative(c.createdAt, now),
        }))}
        related={data.related.map((r, i) => ArticleService.toCard(r, i + 1))}
        liked={liked}
        shareLabel={this.state.shareLabel}
        commentStatus={commentStatus}
        commentError={commentError}
        onLike={this.like}
        onShare={this.share}
        onComment={this.comment}
      />
    );
  }
}

const mapState = (s) => ({
  data: s.articles.current,
  loading: s.articles.currentLoading,
  error: s.articles.currentError,
  liked: s.articles.liked,
  commentStatus: s.articles.commentStatus,
  commentError: s.articles.commentError,
});
export default withRouter(
  connect(mapState, { fetchArticle, likeArticle, postComment })(ArticleDetailController)
);
