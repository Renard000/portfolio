import { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchAdminSeries,
  saveSeries,
  deleteSeries,
} from '../store/slices/adminVideosSlice.js';
import VideoAdminService from '../../bll/services/VideoAdminService.js';
import Video from '../../domain/models/Video.js';
import AdminCrudView from '../views/components/AdminCrudView.jsx';
import SeriesForm from '../views/components/SeriesForm.jsx';

export const SERIES_COLUMNS = [
  {
    key: 'title',
    label: 'Titre',
    value: (s) => s.title,
    render: (s) => <Link to={`/admin/formations/${s.id}`}>{s.title}</Link>,
  },
  { key: 'category', label: 'Catégorie', value: (s) => s.category || '' },
  { key: 'level', label: 'Niveau', value: (s) => Video.levelLabel(s.level) },
  {
    key: 'status',
    label: 'Statut',
    value: (s) => (s.status === 'published' ? 'Publiée' : 'Brouillon'),
  },
  { key: 'videos', label: 'Vidéos', value: (s) => `${s.publishedCount}/${s.videoCount}` },
  {
    key: 'duration',
    label: 'Durée publiée',
    value: (s) => Video.formatTotal(s.totalDurationSeconds),
  },
];

class AdminFormationsController extends Component {
  state = { editing: null, deleting: null, formError: null };

  componentDidMount() {
    this.props.fetchAdminSeries();
  }

  create = () => this.setState({ editing: {}, formError: null });
  edit = (row) => this.setState({ editing: row, formError: null });
  cancelEdit = () => this.setState({ editing: null, formError: null });

  submit = async (values) => {
    const invalid = VideoAdminService.validateSeries(values);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    try {
      await this.props
        .saveSeries({
          id: editing && editing.id,
          dto: VideoAdminService.toSeriesDto(values),
        })
        .unwrap();
      this.setState({ editing: null, formError: null });
      this.props.fetchAdminSeries();
    } catch (err) {
      this.setState({ formError: err.message });
    }
  };

  askDelete = (row) => this.setState({ deleting: row });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { deleting } = this.state;
    this.setState({ deleting: null });
    await this.props.deleteSeries(deleting.id);
  };

  renderForm = (initial) => (
    <SeriesForm
      initial={initial}
      saving={this.props.saving}
      error={this.state.formError}
      onSubmit={this.submit}
      onCancel={this.cancelEdit}
    />
  );

  render() {
    return (
      <AdminCrudView
        title="Formations (séries)"
        rows={this.props.items}
        columns={SERIES_COLUMNS}
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
      />
    );
  }
}

const mapState = (s) => ({
  items: s.adminVideos.list,
  loading: s.adminVideos.loading,
  saving: s.adminVideos.saving,
  error: s.adminVideos.error,
});
export default connect(mapState, { fetchAdminSeries, saveSeries, deleteSeries })(
  AdminFormationsController
);
