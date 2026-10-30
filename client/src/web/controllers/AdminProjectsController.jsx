import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchAdminProjects,
  saveProject,
  deleteProject,
} from '../store/slices/adminPortfolioSlice.js';
import { uploadAsset } from '../store/thunks/uploadAsset.js';
import PortfolioAdminService from '../../bll/services/PortfolioAdminService.js';
import ArticleService from '../../bll/services/ArticleService.js';
import { toCsv } from '../../bll/services/CsvService.js';
import { downloadTextFile } from '../utils/download.js';
import AdminCrudView from '../views/components/AdminCrudView.jsx';
import ProjectForm from '../views/components/ProjectForm.jsx';

export const PROJECT_COLUMNS = [
  { key: 'title', label: 'Titre', value: (p) => p.title },
  { key: 'category', label: 'Catégorie', value: (p) => p.category || '' },
  { key: 'tech', label: 'Technologies', value: (p) => (p.tech || []).join(', ') },
  { key: 'year', label: 'Année', value: (p) => p.year || '' },
  { key: 'featured', label: 'Vedette', value: (p) => (p.featured ? 'Oui' : 'Non') },
  { key: 'sortOrder', label: 'Ordre', value: (p) => p.sortOrder ?? 0 },
];

class AdminProjectsController extends Component {
  state = { editing: null, deleting: null, formError: null, busy: false };

  componentDidMount() {
    this.props.fetchAdminProjects();
  }

  create = () => this.setState({ editing: {}, formError: null });
  edit = (row) => this.setState({ editing: row, formError: null });
  cancelEdit = () => this.setState({ editing: null, formError: null });

  submit = async (values, files) => {
    // Slug déduit du titre s'il est laissé vide
    const v = { ...values, slug: values.slug || ArticleService.slugify(values.title) };
    const invalid = PortfolioAdminService.validateProject(v);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    this.setState({ busy: true, formError: null });
    try {
      const urls = {};
      if (files.imageFile)
        urls.imageUrl = await this.props
          .uploadAsset({ file: files.imageFile, kind: 'image', folder: 'projects' })
          .unwrap();
      const dto = PortfolioAdminService.toProjectDto(v, urls);
      const id = (editing && editing.id) || null;
      const payload = id ? dto : { ...dto, notify: v.notify };
      await this.props.saveProject({ id, dto: payload }).unwrap();
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
    await this.props.deleteProject(deleting.id);
  };

  exportCsv = (rows) =>
    downloadTextFile(
      'projets.csv',
      toCsv(
        rows,
        PROJECT_COLUMNS.map((c) => ({ label: c.label, value: c.value }))
      )
    );

  renderForm = (initial) => (
    <ProjectForm
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
        title="Projets"
        rows={this.props.items}
        columns={PROJECT_COLUMNS}
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
  items: s.adminPortfolio.projects,
  loading: s.adminPortfolio.loading,
  error: s.adminPortfolio.error,
});
export default connect(mapState, {
  fetchAdminProjects,
  saveProject,
  deleteProject,
  uploadAsset,
})(AdminProjectsController);
