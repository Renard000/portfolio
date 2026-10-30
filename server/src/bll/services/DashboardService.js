/** Tableau de bord admin (maquette A-02) : agrège les compteurs et calcule les variations. */
export default class DashboardService {
  constructor(dashboardRepository) {
    this.repo = dashboardRepository;
  }

  /** Variation en % arrondie ; null s'il n'y a pas de période de comparaison. */
  static change(current, previous) {
    if (!previous) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  async get() {
    const [counts, views, viewsByMonth, topArticles, topVideos, videoSeconds] =
      await Promise.all([
        this.repo.counts(),
        this.repo.views30d(),
        this.repo.viewsByMonth(),
        this.repo.topArticles(3),
        this.repo.topVideos(3),
        this.repo.publishedVideoSeconds(),
      ]);
    return {
      views: {
        last30Days: views.current,
        changePct: DashboardService.change(views.current, views.previous),
      },
      articles: counts.articles,
      unreadMessages: counts.unreadMessages,
      pendingComments: counts.pendingComments,
      subscribers: counts.subscribers,
      viewsByMonth,
      topArticles,
      topVideos,
      publishedVideoSeconds: videoSeconds,
    };
  }
}
