const enc = encodeURIComponent;

export default class VideoRepository {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }
  // --- public ---
  listSeries(params) {
    return this.apiClient.get('/video-series', params);
  }
  getSeries(slug) {
    return this.apiClient.get(`/video-series/${enc(slug)}`);
  }
  getVideo(seriesSlug, videoSlug) {
    return this.apiClient.get(
      `/video-series/${enc(seriesSlug)}/videos/${enc(videoSlug)}`
    );
  }
  /** URL CloudFront signée (ne jamais la stocker) : { url, expiresAt }. */
  playback(videoId) {
    return this.apiClient.post(`/videos/${enc(videoId)}/playback`);
  }
  registerView(videoId) {
    return this.apiClient.post(`/videos/${enc(videoId)}/view`);
  }
  // --- admin ---
  listSeriesAdmin() {
    return this.apiClient.get('/admin/video-series');
  }
  getSeriesAdmin(id) {
    return this.apiClient.get(`/admin/video-series/${enc(id)}`);
  }
  createSeries(dto) {
    return this.apiClient.post('/video-series', dto);
  }
  updateSeries(id, dto) {
    return this.apiClient.put(`/video-series/${enc(id)}`, dto);
  }
  deleteSeries(id) {
    return this.apiClient.delete(`/video-series/${enc(id)}`);
  }
  orderVideos(seriesId, videoIds) {
    return this.apiClient.put(`/video-series/${enc(seriesId)}/order`, { videoIds });
  }
  createVideo(dto) {
    return this.apiClient.post('/videos', dto);
  }
  updateVideo(id, dto) {
    return this.apiClient.put(`/videos/${enc(id)}`, dto);
  }
  deleteVideo(id) {
    return this.apiClient.delete(`/videos/${enc(id)}`);
  }
  requestUploadUrl(dto) {
    return this.apiClient.post('/admin/videos/upload-url', dto);
  }
}
