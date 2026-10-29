import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchAdminSeriesDetail,
  saveVideo,
  deleteVideo,
  orderVideos,
  uploadVideoFile,
} from '../store/slices/adminVideosSlice.js';
import VideoAdminService from '../../bll/services/VideoAdminService.js';
import AdminSeriesView from '../views/components/AdminSeriesView.jsx';
import VideoForm from '../views/components/VideoForm.jsx';

class AdminSeriesController extends Component {
  state = { editing: null, deleting: null, formError: null, busy: false, progress: null };
  abort = null;

  componentDidMount() {
    this.props.fetchAdminSeriesDetail(this.props.id);
  }

  componentWillUnmount() {
    if (this.abort) this.abort.abort(); // ne laisse pas un envoi de plusieurs Go courir en arrière-plan
  }

  create = () => this.setState({ editing: {}, formError: null, progress: null });
  edit = (row) => this.setState({ editing: row, formError: null, progress: null });
  cancelEdit = () => {
    if (this.abort) this.abort.abort();
    this.setState({ editing: null, formError: null, progress: null });
  };
  cancelUpload = () => {
    if (this.abort) this.abort.abort();
  };

  /** Envoie les fichiers choisis (clé générée par le serveur), puis enregistre la vidéo. */
  upload = async (file, kind, videoSlug) => {
    this.abort = new AbortController();
    this.setState({ progress: 0 });
    try {
      return await this.props
        .uploadVideoFile({
          seriesId: this.props.id,
          videoSlug,
          kind,
          file,
          signal: this.abort.signal,
          onProgress: (p) => this.setState({ progress: p }),
        })
        .unwrap();
    } finally {
      this.abort = null;
      this.setState({ progress: null });
    }
  };

  submit = async (values) => {
    const invalid = VideoAdminService.validateVideo(values);
    if (invalid) return this.setState({ formError: invalid });
    const { editing } = this.state;
    this.setState({ busy: true, formError: null });
    try {
      const keys = {};
      if (values.file)
        keys.videoKey = await this.upload(values.file, 'video', values.slug.trim());
      if (values.posterFile)
        keys.posterKey = await this.upload(
          values.posterFile,
          'poster',
          values.slug.trim()
        );
      const dto = VideoAdminService.toVideoDto(values, keys);
      if (editing && editing.id)
        await this.props.saveVideo({ id: editing.id, dto }).unwrap();
      else
        await this.props.saveVideo({ dto: { ...dto, seriesId: this.props.id } }).unwrap();
      this.setState({ editing: null, busy: false });
    } catch (err) {
      this.setState({ formError: err.message, busy: false });
    }
  };

  move = (id, delta) => {
    const ids = VideoAdminService.moveId(this.props.series.videos, id, delta);
    this.props.orderVideos({ seriesId: this.props.id, videoIds: ids });
  };

  askDelete = (row) => this.setState({ deleting: row });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { deleting } = this.state;
    this.setState({ deleting: null });
    await this.props.deleteVideo(deleting.id);
  };

  renderForm = (initial) => (
    <VideoForm
      initial={initial}
      saving={this.state.busy}
      error={this.state.formError}
      uploadProgress={this.state.progress}
      onSubmit={this.submit}
      onCancel={this.cancelEdit}
      onCancelUpload={this.cancelUpload}
    />
  );

  render() {
    return (
      <AdminSeriesView
        series={this.props.series}
        loading={this.props.loading}
        error={this.props.error}
        editing={this.state.editing}
        deleting={this.state.deleting}
        renderForm={this.renderForm}
        onCreate={this.create}
        onEdit={this.edit}
        onAskDelete={this.askDelete}
        onMove={this.move}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
        onCancelEdit={this.cancelEdit}
      />
    );
  }
}

const mapState = (s, own) => ({
  id: own.match.params.id,
  series: s.adminVideos.current,
  loading: s.adminVideos.loading,
  error: s.adminVideos.error,
});
export default connect(mapState, {
  fetchAdminSeriesDetail,
  saveVideo,
  deleteVideo,
  orderVideos,
  uploadVideoFile,
})(AdminSeriesController);
