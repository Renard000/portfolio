export default class VideoAdminController {
  constructor(videoService, videoUploadService) {
    this.videoService = videoService;
    this.videoUploadService = videoUploadService;
  }

  async listSeries(req, res) {
    res.json(await this.videoService.listSeriesAdmin());
  }
  async getSeries(req, res) {
    res.json(await this.videoService.getSeriesAdmin(req.validated.params.id));
  }
  async createSeries(req, res) {
    res.status(201).json(await this.videoService.createSeries(req.validated.body));
  }
  async updateSeries(req, res) {
    res.json(
      await this.videoService.updateSeries(req.validated.params.id, req.validated.body)
    );
  }
  async deleteSeries(req, res) {
    await this.videoService.deleteSeries(req.validated.params.id);
    res.status(204).end();
  }
  async order(req, res) {
    res.json(
      await this.videoService.orderVideos(
        req.validated.params.id,
        req.validated.body.videoIds
      )
    );
  }
  async createVideo(req, res) {
    res.status(201).json(await this.videoService.createVideo(req.validated.body));
  }
  async updateVideo(req, res) {
    res.json(
      await this.videoService.updateVideo(req.validated.params.id, req.validated.body)
    );
  }
  async deleteVideo(req, res) {
    await this.videoService.deleteVideo(req.validated.params.id);
    res.status(204).end();
  }
  async uploadUrl(req, res) {
    res.set('Cache-Control', 'no-store');
    res.json(await this.videoUploadService.createUpload(req.validated.body));
  }
}
