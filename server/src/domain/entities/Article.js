import { ValidationError } from '../errors/index.js';

export default class Article {
  constructor({
    id,
    title,
    slug,
    excerpt = null,
    status = 'draft',
    publishedAt = null,
    ...rest
  }) {
    Object.assign(this, { id, title, slug, excerpt, status, publishedAt, ...rest });
  }

  isPublished() {
    return this.status === 'published';
  }

  publish(now = new Date()) {
    if (this.isPublished()) throw new ValidationError('Article déjà publié');
    this.status = 'published';
    this.publishedAt = now.toISOString();
  }
}
