const WINDOW_DAYS = 14;
const LIMIT = 30;
const DAY = 24 * 60 * 60 * 1000;

/** Publications encore considérées comme nouvelles. */
export default class PublicationFeedService {
  constructor(publicationFeedRepository, clock = () => new Date()) {
    this.repo = publicationFeedRepository;
    this.clock = clock;
  }

  list() {
    const since = new Date(this.clock().getTime() - WINDOW_DAYS * DAY).toISOString();
    return this.repo.listSince(since, LIMIT);
  }
}
