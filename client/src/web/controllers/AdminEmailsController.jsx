import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchTemplates,
  saveTemplate,
  resetTemplate,
  previewTemplate,
  testTemplate,
  broadcastNews,
} from '../store/slices/emailTemplatesSlice.js';
import { fetchSubscribers } from '../store/slices/subscribersSlice.js';
import EmailAdminService from '../../bll/services/EmailAdminService.js';
import EmailTemplatesView from '../views/pages/admin/EmailTemplatesView.jsx';

const PREVIEW_DELAY = 400;

const toValues = (t) => ({
  subject: t.subject || '',
  heading: t.heading || '',
  body: t.body || '',
  ctaLabel: t.ctaLabel || '',
  ctaUrl: '',
});

class AdminEmailsController extends Component {
  state = {
    key: null,
    values: toValues({}),
    testTo: '',
    busy: false,
    error: null,
    notice: null,
    confirming: false,
  };

  async componentDidMount() {
    this.props.fetchSubscribers();
    const items = await this.props.fetchTemplates().unwrap();
    if (items[0]) this.select(items[0].key, items);
  }

  componentWillUnmount() {
    clearTimeout(this.previewTimer);
  }

  get template() {
    return this.props.items.find((t) => t.key === this.state.key);
  }

  select = (key, items = this.props.items) => {
    const template = items.find((t) => t.key === key);
    this.setState({ key, values: toValues(template), error: null, notice: null }, () =>
      this.refreshPreview()
    );
  };

  change = (field, value) => {
    this.setState((s) => ({ values: { ...s.values, [field]: value }, notice: null }));
    clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(this.refreshPreview, PREVIEW_DELAY);
  };

  refreshPreview = () => {
    const { key, values } = this.state;
    if (!EmailAdminService.validate(values)) this.props.previewTemplate({ key, values });
  };

  /** Valide, exécute l'action, puis affiche le résultat ou l'erreur. */
  async run(action, notice) {
    const invalid = EmailAdminService.validate(this.state.values);
    if (invalid) return this.setState({ error: invalid, notice: null });
    this.setState({ busy: true, error: null, notice: null });
    try {
      const result = await action();
      this.setState({ busy: false, notice: notice(result) });
    } catch (err) {
      this.setState({ busy: false, error: err.message });
    }
  }

  save = () =>
    this.run(
      () =>
        this.props
          .saveTemplate({ key: this.state.key, values: this.state.values })
          .unwrap(),
      () => 'Modèle enregistré.'
    );

  reset = async () => {
    const template = await this.props.resetTemplate(this.state.key).unwrap();
    this.setState(
      { values: toValues(template), notice: 'Modèle par défaut rétabli.' },
      () => this.refreshPreview()
    );
  };

  test = () => {
    const { key, values, testTo } = this.state;
    return this.run(
      () => this.props.testTemplate({ key, values, to: testTo }).unwrap(),
      () => `Courriel de test envoyé à ${testTo}.`
    );
  };

  askBroadcast = () => this.setState({ confirming: true });
  cancelBroadcast = () => this.setState({ confirming: false });
  confirmBroadcast = () => {
    this.setState({ confirming: false });
    return this.run(
      () => this.props.broadcastNews(this.state.values).unwrap(),
      (r) => `News envoyée : ${r.sent} réussi(s), ${r.failed} échec(s).`
    );
  };

  render() {
    const { items, preview, newsletter, error } = this.props;
    return (
      <EmailTemplatesView
        templates={items}
        selectedKey={this.state.key}
        template={this.template}
        values={this.state.values}
        preview={preview}
        testTo={this.state.testTo}
        subscribers={newsletter.filter((s) => s.confirmed && s.active).length}
        busy={this.state.busy}
        error={this.state.error || error}
        notice={this.state.notice}
        confirming={this.state.confirming}
        onSelect={this.select}
        onChange={this.change}
        onSave={this.save}
        onReset={this.reset}
        onTestTo={(testTo) => this.setState({ testTo })}
        onTest={this.test}
        onAskBroadcast={this.askBroadcast}
        onConfirmBroadcast={this.confirmBroadcast}
        onCancelBroadcast={this.cancelBroadcast}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.emailTemplates.items,
  preview: s.emailTemplates.preview,
  error: s.emailTemplates.error,
  newsletter: s.subscribers.newsletter,
});
export default connect(mapState, {
  fetchTemplates,
  saveTemplate,
  resetTemplate,
  previewTemplate,
  testTemplate,
  broadcastNews,
  fetchSubscribers,
})(AdminEmailsController);
