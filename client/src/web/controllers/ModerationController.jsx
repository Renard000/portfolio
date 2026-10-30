import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchComments,
  fetchMessages,
  moderateComment,
  removeComment,
  markMessage,
  removeMessage,
} from '../store/slices/moderationSlice.js';
import AdminContentService from '../../bll/services/AdminContentService.js';
import ArticleService from '../../bll/services/ArticleService.js';
import ModerationView from '../views/pages/admin/ModerationView.jsx';

/** /admin/commentaires et /admin/messages : même écran (maquette A-05). */
class ModerationController extends Component {
  state = { commentTab: 'pending', messageTab: 'unread', deleting: null };

  componentDidMount() {
    // Les listes servent aussi aux pastilles de la barre latérale
    this.props.fetchComments();
    this.props.fetchMessages();
  }

  approve = (c) => this.props.moderateComment({ id: c.id, approved: true });
  unapprove = (c) => this.props.moderateComment({ id: c.id, approved: false });
  markRead = (m) => this.props.markMessage({ id: m.id, lu: !m.lu });
  askDelete = (kind, item) => this.setState({ deleting: { kind, item } });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { kind, item } = this.state.deleting;
    this.setState({ deleting: null });
    if (kind === 'comment') await this.props.removeComment(item.id);
    else await this.props.removeMessage(item.id);
  };

  render() {
    const { comments, messages, loading, error } = this.props;
    const { commentTab, messageTab } = this.state;
    const now = new Date();
    const pending = comments.filter((c) => !c.approved);
    const unread = messages.filter((m) => !m.lu);
    const shownComments = (
      commentTab === 'pending' ? pending : comments.filter((c) => c.approved)
    ).map((c) => ({
      ...c,
      articleTitle: c.article ? c.article.title : 'article supprimé',
      when: ArticleService.relative(c.createdAt, now),
    }));
    const shownMessages = (messageTab === 'unread' ? unread : messages).map((m) => ({
      ...m,
      when: ArticleService.relative(m.createdAt, now),
      replyHref: AdminContentService.replyHref(m),
    }));
    return (
      <ModerationView
        comments={shownComments}
        messages={shownMessages}
        commentTabs={[
          { key: 'pending', label: `À modérer (${pending.length})` },
          { key: 'approved', label: 'Approuvés' },
        ]}
        messageTabs={[
          { key: 'unread', label: `Non lus (${unread.length})` },
          { key: 'all', label: 'Tous' },
        ]}
        commentTab={commentTab}
        messageTab={messageTab}
        loading={loading}
        error={error}
        deleting={this.state.deleting}
        onCommentTab={(commentTab) => this.setState({ commentTab })}
        onMessageTab={(messageTab) => this.setState({ messageTab })}
        onApprove={this.approve}
        onUnapprove={this.unapprove}
        onMarkRead={this.markRead}
        onAskDelete={this.askDelete}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
      />
    );
  }
}

const mapState = (s) => ({
  comments: s.moderation.comments,
  messages: s.moderation.messages,
  loading: s.moderation.loading,
  error: s.moderation.error,
});
export default connect(mapState, {
  fetchComments,
  fetchMessages,
  moderateComment,
  removeComment,
  markMessage,
  removeMessage,
})(ModerationController);
