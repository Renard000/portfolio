import { ValidationError } from '../errors/index.js';

/** Vitesse de lecture moyenne retenue pour la durée affichée (« 8 min »). */
const WORDS_PER_MINUTE = 220;

export default class Article {
  constructor({
    id,
    title,
    slug,
    excerpt = null,
    content = '',
    coverUrl = null,
    category = null,
    tags = [],
    status = 'draft',
    views = 0,
    likes = 0,
    publishedAt = null,
    createdAt = null,
    ...rest
  }) {
    Object.assign(this, {
      id,
      title,
      slug,
      excerpt,
      content: content || '',
      coverUrl,
      category,
      tags: tags || [],
      status,
      views: views ?? 0,
      likes: likes ?? 0,
      publishedAt,
      createdAt,
      ...rest,
    });
  }

  isPublished() {
    return this.status === 'published';
  }

  publish(now = new Date()) {
    if (this.isPublished()) throw new ValidationError('Article déjà publié');
    this.status = 'published';
    this.publishedAt = now.toISOString();
  }

  /** Repasse en brouillon (l'article disparaît du blog public). */
  unpublish() {
    this.status = 'draft';
    this.publishedAt = null;
  }

  /** Durée de lecture estimée, au moins 1 minute. */
  readingMinutes() {
    const words = String(this.content).trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  /** Version de liste : sans le texte complet (E.7 : texte complet sur la route de détail). */
  toSummary() {
    // eslint-disable-next-line no-unused-vars
    const { content, ...rest } = this.toJSON();
    return rest;
  }

  toJSON() {
    return { ...this, readingMinutes: this.readingMinutes() };
  }
}
