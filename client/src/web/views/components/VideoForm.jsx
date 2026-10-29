import { Component, createRef } from 'react';
import Video from '../../../domain/models/Video.js';

const EMPTY = {
  title: '',
  slug: '',
  description: '',
  duration: '',
  status: 'draft',
  videoKey: '',
  posterKey: '',
};

/** Formulaire vidéo : fichier (envoi direct S3 avec progression), chapitres, ressources. */
export default class VideoForm extends Component {
  fileRef = createRef();

  constructor(props) {
    super(props);
    const v = props.initial;
    this.state = {
      values: v
        ? {
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(v).filter(([, x]) => x !== null && x !== undefined)
            ),
            duration: Video.formatDuration(v.durationSeconds),
          }
        : { ...EMPTY },
      chapters: v
        ? (v.chapters || []).map((c) => ({
            time: Video.formatDuration(c.t),
            label: c.label,
          }))
        : [],
      resources: v ? (v.resources || []).map((r) => ({ ...r })) : [],
      file: null,
      posterFile: null,
    };
  }

  set = (key) => (e) => {
    const { value } = e.target;
    this.setState((s) => ({ values: { ...s.values, [key]: value } }));
  };

  setRow = (list, i, key) => (e) => {
    const { value } = e.target;
    this.setState((s) => ({
      [list]: s[list].map((row, j) => (j === i ? { ...row, [key]: value } : row)),
    }));
  };
  addRow = (list, row) => () => this.setState((s) => ({ [list]: [...s[list], row] }));
  removeRow = (list, i) => () =>
    this.setState((s) => ({ [list]: s[list].filter((_, j) => j !== i) }));

  submit = (e) => {
    e.preventDefault();
    const { values, chapters, resources, file, posterFile } = this.state;
    this.props.onSubmit({ ...values, chapters, resources, file, posterFile });
  };

  render() {
    const { saving, error, uploadProgress, onCancel, onCancelUpload } = this.props;
    const { values: v, chapters, resources, file } = this.state;
    const uploading = uploadProgress !== null && uploadProgress !== undefined;
    return (
      <form onSubmit={this.submit} className="row g-3" noValidate>
        <div className="col-md-6">
          <label htmlFor="v-title" className="form-label">
            Titre *
          </label>
          <input
            id="v-title"
            className="form-control"
            value={v.title}
            onChange={this.set('title')}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="v-slug" className="form-label">
            Slug *
          </label>
          <input
            id="v-slug"
            className="form-control"
            value={v.slug}
            onChange={this.set('slug')}
            required
          />
        </div>
        <div className="col-12">
          <label htmlFor="v-desc" className="form-label">
            Description
          </label>
          <textarea
            id="v-desc"
            rows="3"
            className="form-control"
            value={v.description}
            onChange={this.set('description')}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="v-duration" className="form-label">
            Durée * (mm:ss)
          </label>
          <input
            id="v-duration"
            className="form-control"
            placeholder="26:30"
            value={v.duration}
            onChange={this.set('duration')}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="v-status" className="form-label">
            Statut
          </label>
          <select
            id="v-status"
            className="form-select"
            value={v.status}
            onChange={this.set('status')}
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
          </select>
        </div>
        <div className="col-md-6">
          <label htmlFor="v-file" className="form-label">
            Fichier vidéo (MP4)
          </label>
          <input
            id="v-file"
            ref={this.fileRef}
            type="file"
            accept="video/mp4"
            className="form-control"
            onChange={(e) => this.setState({ file: e.target.files[0] || null })}
          />
          <small className="text-muted">
            Envoi direct vers S3 : le fichier ne passe pas par votre hébergement.
          </small>
        </div>
        <div className="col-md-6">
          <label htmlFor="v-poster" className="form-label">
            Affiche (JPEG, PNG, WebP)
          </label>
          <input
            id="v-poster"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-control"
            onChange={(e) => this.setState({ posterFile: e.target.files[0] || null })}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="v-key" className="form-label">
            …ou clé S3 de la vidéo
          </label>
          <input
            id="v-key"
            className="form-control"
            placeholder="videos/ma-serie/01-intro.mp4"
            value={v.videoKey}
            onChange={this.set('videoKey')}
            disabled={Boolean(file)}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="v-pkey" className="form-label">
            …ou clé S3 de l’affiche
          </label>
          <input
            id="v-pkey"
            className="form-control"
            placeholder="posters/ma-serie/01-intro.jpg"
            value={v.posterKey}
            onChange={this.set('posterKey')}
          />
        </div>

        {uploading ? (
          <div className="col-12">
            <div
              className="progress"
              role="progressbar"
              aria-label="Envoi du fichier"
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="d-flex justify-content-between mt-1">
              <small>{uploadProgress} %</small>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onCancelUpload}
              >
                Annuler l’envoi
              </button>
            </div>
          </div>
        ) : null}

        <fieldset className="col-12">
          <legend className="h6">Chapitres</legend>
          {chapters.map((c, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input
                aria-label={`Temps du chapitre ${i + 1}`}
                className="form-control"
                style={{ maxWidth: 110 }}
                placeholder="04:12"
                value={c.time}
                onChange={this.setRow('chapters', i, 'time')}
              />
              <input
                aria-label={`Libellé du chapitre ${i + 1}`}
                className="form-control"
                placeholder="Libellé"
                value={c.label}
                onChange={this.setRow('chapters', i, 'label')}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                aria-label={`Retirer le chapitre ${i + 1}`}
                onClick={this.removeRow('chapters', i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={this.addRow('chapters', { time: '', label: '' })}
          >
            + Chapitre
          </button>
        </fieldset>
        <fieldset className="col-12">
          <legend className="h6">Ressources</legend>
          {resources.map((r, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input
                aria-label={`Libellé de la ressource ${i + 1}`}
                className="form-control"
                placeholder="Dépôt GitHub"
                value={r.label}
                onChange={this.setRow('resources', i, 'label')}
              />
              <input
                aria-label={`Adresse de la ressource ${i + 1}`}
                className="form-control"
                placeholder="https://…"
                value={r.url}
                onChange={this.setRow('resources', i, 'url')}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                aria-label={`Retirer la ressource ${i + 1}`}
                onClick={this.removeRow('resources', i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={this.addRow('resources', { label: '', url: '' })}
          >
            + Ressource
          </button>
        </fieldset>

        {error ? (
          <div className="col-12">
            <div className="alert alert-danger mb-0" role="alert">
              {error}
            </div>
          </div>
        ) : null}
        <div className="col-12 d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    );
  }
}
VideoForm.defaultProps = { uploadProgress: null };
