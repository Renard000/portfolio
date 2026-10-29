export default class VideoController {
  constructor(videoService, playbackService) {
    this.videoService = videoService;
    this.playbackService = playbackService;
  }

  async listSeries(req, res) {
    res.json(await this.videoService.listSeries(req.validated.query));
  }

  async getSeries(req, res) {
    res.json(await this.videoService.getSeries(req.validated.params.slug));
  }

  async getVideo(req, res) {
    const { seriesSlug, videoSlug } = req.validated.params;
    res.json(await this.videoService.getVideo(seriesSlug, videoSlug));
  }

  async view(req, res) {
    await this.videoService.registerView(req.validated.params.id);
    res.status(204).end();
  }

  /** URL signée, jamais mise en cache par le navigateur ni par un proxy. */
  async playback(req, res) {
    res.set('Cache-Control', 'no-store');
    res.json(await this.playbackService.createPlayback(req.validated.params.id));
  }
}
