/** Observateur : inscrit la publication au fil lu en temps réel par le site. */
export default class FeedPublicationObserver {
  channel = 'feed';

  constructor(publicationFeedRepository) {
    this.repo = publicationFeedRepository;
  }

  async onPublication(publication) {
    await this.repo.record(publication);
    return { sent: 1, failed: 0, deactivated: 0 };
  }

  /** Contenu dépublié ou supprimé : il ne doit plus apparaître comme nouveau. */
  onRetraction(reference) {
    return this.repo.remove(reference);
  }
}
