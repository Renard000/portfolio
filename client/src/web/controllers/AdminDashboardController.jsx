import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchDashboard } from '../store/slices/dashboardSlice.js';
import AdminContentService from '../../bll/services/AdminContentService.js';
import ArticleService from '../../bll/services/ArticleService.js';
import DashboardView from '../views/pages/admin/DashboardView.jsx';

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/** Prépare les valeurs affichées (la vue ne calcule rien). Exportée pour les tests. */
export function toDashboardModel(d) {
  const change = d.views.changePct;
  const todo = [
    d.pendingComments && {
      to: '/admin/commentaires',
      label: `${plural(d.pendingComments, 'commentaire', 'commentaires')} à modérer`,
    },
    d.unreadMessages && {
      to: '/admin/messages',
      label: `${plural(d.unreadMessages, 'message non lu', 'messages non lus')}`,
    },
    d.articles.drafts && {
      to: '/admin/articles',
      label: `${plural(d.articles.drafts, 'article en brouillon', 'articles en brouillon')}`,
    },
  ].filter(Boolean);
  return {
    stats: {
      views: d.views.last30Days,
      viewsNote:
        change === null
          ? 'sur 30 jours'
          : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)} %`,
      published: d.articles.published,
      draftsNote: plural(d.articles.drafts, 'brouillon', 'brouillons'),
      unread: d.unreadMessages,
      subscribers: d.subscribers.confirmed,
      subscribersNote: `▲ ${d.subscribers.newThisWeek} cette semaine`,
    },
    bars: AdminContentService.monthBars(d.viewsByMonth),
    todo,
    topArticles: d.topArticles.map((a) => ({
      ...a,
      views: ArticleService.thousands(a.views),
    })),
    topVideos: d.topVideos.map((v) => ({
      ...v,
      views: ArticleService.thousands(v.views),
    })),
    videoDuration: AdminContentService.formatDuration(d.publishedVideoSeconds),
  };
}

class AdminDashboardController extends Component {
  componentDidMount() {
    this.props.fetchDashboard();
  }

  render() {
    const { data, loading, error } = this.props;
    return (
      <DashboardView
        data={data ? toDashboardModel(data) : null}
        loading={loading}
        error={error}
        onRetry={this.props.fetchDashboard}
      />
    );
  }
}

const mapState = (s) => ({
  data: s.dashboard.data,
  loading: s.dashboard.loading,
  error: s.dashboard.error,
});
export default connect(mapState, { fetchDashboard })(AdminDashboardController);
