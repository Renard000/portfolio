import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchSubscribers,
  removeNewsletterSubscriber,
  removePushSubscriber,
  sendTestEmail,
} from '../store/slices/subscribersSlice.js';
import { toCsv } from '../../bll/services/CsvService.js';
import { downloadTextFile } from '../utils/download.js';
import SubscribersView, {
  NEWSLETTER_COLUMNS,
  PUSH_COLUMNS,
} from '../views/components/SubscribersView.jsx';

class AdminSubscribersController extends Component {
  state = { deleting: null };

  componentDidMount() {
    this.props.fetchSubscribers();
  }

  askDelete = (kind, row) => this.setState({ deleting: { kind, row } });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { kind, row } = this.state.deleting;
    this.setState({ deleting: null });
    if (kind === 'newsletter') await this.props.removeNewsletterSubscriber(row.id);
    else await this.props.removePushSubscriber(row.id);
  };

  exportCsv = (kind, rows) => {
    const cols = kind === 'newsletter' ? NEWSLETTER_COLUMNS : PUSH_COLUMNS;
    downloadTextFile(
      `abonnes-${kind}.csv`,
      toCsv(
        rows,
        cols.map((c) => ({ label: c.label, value: c.value }))
      )
    );
  };

  render() {
    const p = this.props;
    return (
      <SubscribersView
        newsletter={p.newsletter}
        push={p.push}
        loading={p.loading}
        error={p.error}
        testStatus={p.testStatus}
        deleting={this.state.deleting}
        onAskDelete={this.askDelete}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
        onExport={this.exportCsv}
        onSendTest={p.sendTestEmail}
      />
    );
  }
}

const mapState = (s) => ({
  newsletter: s.subscribers.newsletter,
  push: s.subscribers.push,
  loading: s.subscribers.loading,
  error: s.subscribers.error,
  testStatus: s.subscribers.testStatus,
});
export default connect(mapState, {
  fetchSubscribers,
  removeNewsletterSubscriber,
  removePushSubscriber,
  sendTestEmail,
})(AdminSubscribersController);
