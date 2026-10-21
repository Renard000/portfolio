import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} from '../store/slices/certificationsSlice.js';
import { uploadAsset } from '../store/thunks/uploadAsset.js';
import CertificationService from '../../bll/services/CertificationService.js';
import { toCsv } from '../../bll/services/CsvService.js';
import Certification from '../../domain/models/Certification.js';
import { downloadTextFile } from '../utils/download.js';
import AdminCrudView from '../views/components/AdminCrudView.jsx';
import CertificationForm from '../views/components/CertificationForm.jsx';

export const CERT_COLUMNS = [
  { key: 'title', label: 'Titre', value: (c) => c.title },
  { key: 'issuer', label: 'Émetteur', value: (c) => c.issuer },
  { key: 'category', label: 'Catégorie', value: (c) => c.category || '' },
  { key: 'issueDate', label: 'Obtenue le', value: (c) => c.issueDate },
  { key: 'status', label: 'Statut', value: (c) => new Certification(c).statusLabel() },
  { key: 'featured', label: 'Vedette', value: (c) => (c.featured ? 'Oui' : 'Non') },
  { key: 'sortOrder', label: 'Ordre', value: (c) => c.sortOrder },
];

class AdminCertificationsController extends Component {
  state = { editing: null, deleting: null, formError: null, busy: false };

  componentDidMount() {
    this.props.fetchCertifications();
  }

  create = () => this.setState({ editing: {}, formError: null });
  edit = (row) => this.setState({ editing: row, formError: null });
  cancelEdit = () => this.setState({ editing: null, formError: null });

  submit = async (values, files) => {
    const invalid = CertificationService.validate(values);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    this.setState({ busy: true, formError: null });
    try {
      const urls = {};
      if (files.imageFile)
        urls.imageUrl = await this.props
          .uploadAsset({ file: files.imageFile, kind: 'image', folder: 'certifications' })
          .unwrap();
      if (files.documentFile)
        urls.documentUrl = await this.props
          .uploadAsset({
            file: files.documentFile,
            kind: 'document',
            folder: 'certifications',
          })
          .unwrap();
      const dto = CertificationService.toDto(values, urls);
      if (editing && editing.id)
        await this.props.updateCertification({ id: editing.id, dto }).unwrap();
      else await this.props.createCertification(dto).unwrap();
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
    await this.props.deleteCertification(deleting.id);
  };

  exportCsv = (rows) =>
    downloadTextFile(
      'certifications.csv',
      toCsv(
        rows,
        CERT_COLUMNS.map((c) => ({ label: c.label, value: c.value }))
      )
    );

  renderForm = (initial) => (
    <CertificationForm
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
        title="Certifications"
        rows={this.props.items}
        columns={CERT_COLUMNS}
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
  items: s.certifications.items,
  loading: s.certifications.loading,
  error: s.certifications.error,
});
export default connect(mapState, {
  fetchCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  uploadAsset,
})(AdminCertificationsController);
