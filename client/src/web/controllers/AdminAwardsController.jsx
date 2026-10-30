import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchAwards,
  createAward,
  updateAward,
  deleteAward,
} from '../store/slices/awardsSlice.js';
import { uploadAsset } from '../store/thunks/uploadAsset.js';
import AwardService from '../../bll/services/AwardService.js';
import { toCsv } from '../../bll/services/CsvService.js';
import Award from '../../domain/models/Award.js';
import { downloadTextFile } from '../utils/download.js';
import AdminCrudView from '../views/components/AdminCrudView.jsx';
import AwardForm from '../views/components/AwardForm.jsx';

export const AWARD_COLUMNS = [
  { key: 'title', label: 'Titre', value: (a) => a.title },
  { key: 'type', label: 'Type', value: (a) => new Award(a).typeLabel() },
  { key: 'organization', label: 'Organisme', value: (a) => a.organization },
  { key: 'awardedAt', label: 'Date', value: (a) => a.awardedAt },
  { key: 'amount', label: 'Montant', value: (a) => (a.amount === null ? '' : a.amount) },
  { key: 'currency', label: 'Devise', value: (a) => a.currency },
  { key: 'featured', label: 'Vedette', value: (a) => (a.featured ? 'Oui' : 'Non') },
];

class AdminAwardsController extends Component {
  state = { editing: null, deleting: null, formError: null, busy: false };

  componentDidMount() {
    this.props.fetchAwards();
  }

  create = () => this.setState({ editing: {}, formError: null });
  edit = (row) => this.setState({ editing: row, formError: null });
  cancelEdit = () => this.setState({ editing: null, formError: null });

  submit = async (values, files) => {
    const invalid = AwardService.validate(values);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    this.setState({ busy: true, formError: null });
    try {
      const urls = {};
      if (files.imageFile)
        urls.imageUrl = await this.props
          .uploadAsset({ file: files.imageFile, kind: 'image', folder: 'awards' })
          .unwrap();
      if (files.documentFile)
        urls.documentUrl = await this.props
          .uploadAsset({ file: files.documentFile, kind: 'document', folder: 'awards' })
          .unwrap();
      const dto = AwardService.toDto(values, urls);
      if (editing && editing.id)
        await this.props.updateAward({ id: editing.id, dto }).unwrap();
      else await this.props.createAward({ ...dto, notify: values.notify }).unwrap();
      this.setState({ editing: null, busy: false });
    } catch (err) {
      this.setState({ formError: err.message, busy: false });
    }
  };

  askDelete = (row) => this.setState({ deleting: row });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { deleting } = this.state;
    this.setState({ deleting: null });
    await this.props.deleteAward(deleting.id);
  };

  exportCsv = (rows) =>
    downloadTextFile(
      'distinctions.csv',
      toCsv(
        rows,
        AWARD_COLUMNS.map((c) => ({ label: c.label, value: c.value }))
      )
    );

  renderForm = (initial) => (
    <AwardForm
      initial={initial}
      saving={this.state.busy}
      error={this.state.formError}
      onSubmit={this.submit}
      onCancel={this.cancelEdit}
    />
  );

  render() {
    return (
      <AdminCrudView
        title="Distinctions"
        rows={this.props.items}
        columns={AWARD_COLUMNS}
        loading={this.props.loading}
        error={this.props.error}
        editing={this.state.editing}
        deleting={this.state.deleting}
        renderForm={this.renderForm}
        onCreate={this.create}
        onEdit={this.edit}
        onAskDelete={this.askDelete}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
        onCancelEdit={this.cancelEdit}
        onExport={this.exportCsv}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.awards.items,
  loading: s.awards.loading,
  error: s.awards.error,
});
export default connect(mapState, {
  fetchAwards,
  createAward,
  updateAward,
  deleteAward,
  uploadAsset,
})(AdminAwardsController);
