import Certification from '../../src/domain/entities/Certification.js';
import Award from '../../src/domain/entities/Award.js';
import NewsletterSubscriber from '../../src/domain/entities/NewsletterSubscriber.js';
import PushSubscription from '../../src/domain/entities/PushSubscription.js';

let n = 0;
export const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

/** Faux repository en mémoire pour certifications / awards. */
export class MemoryCrudRepo {
  constructor(Entity, items = []) {
    this.Entity = Entity;
    this.items = items;
  }
  async list() {
    return [...this.items];
  }
  async findById(id) {
    return this.items.find((i) => i.id === id) || null;
  }
  async create(dto) {
    const item = new this.Entity({
      id: uuid(),
      createdAt: new Date().toISOString(),
      ...dto,
    });
    this.items.push(item);
    return item;
  }
  async update(id, dto) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return null;
    this.items[i] = new this.Entity({ ...this.items[i], ...dto });
    return this.items[i];
  }
  async delete(id) {
    const before = this.items.length;
    this.items = this.items.filter((x) => x.id !== id);
    return this.items.length < before;
  }
}

export class MemoryNewsletterRepo {
  constructor() {
    this.items = [];
  }
  async create(email) {
    const s = new NewsletterSubscriber({
      id: uuid(),
      email,
      confirmToken: uuid(),
      unsubscribeToken: uuid(),
      createdAt: new Date().toISOString(),
    });
    this.items.push(s);
    return s;
  }
  async findByEmail(email) {
    return this.items.find((s) => s.email.toLowerCase() === email.toLowerCase()) || null;
  }
  async findByConfirmToken(t) {
    return this.items.find((s) => s.confirmToken === t) || null;
  }
  async findByUnsubscribeToken(t) {
    return this.items.find((s) => s.unsubscribeToken === t) || null;
  }
  async update(id, patch) {
    const s = this.items.find((x) => x.id === id);
    if (patch.active !== undefined) s.active = patch.active;
    if (patch.confirmedAt !== undefined) s.confirmedAt = patch.confirmedAt;
    if (patch.unsubscribedAt !== undefined) s.unsubscribedAt = patch.unsubscribedAt;
    if (patch.regenerateConfirmToken) s.confirmToken = uuid();
    return s;
  }
  async listAll() {
    return [...this.items];
  }
  async listReceivers() {
    return this.items.filter((s) => s.canReceive());
  }
  async delete(id) {
    const b = this.items.length;
    this.items = this.items.filter((s) => s.id !== id);
    return this.items.length < b;
  }
}

export class MemoryPushRepo {
  constructor() {
    this.items = [];
  }
  async upsert(token) {
    let p = this.items.find((x) => x.fcmToken === token);
    if (p) p.active = true;
    else {
      p = new PushSubscription({ id: uuid(), fcmToken: token });
      this.items.push(p);
    }
    return p;
  }
  async listAll() {
    return [...this.items];
  }
  async listActive() {
    return this.items.filter((p) => p.active);
  }
  async deactivate(tokens) {
    this.items.forEach((p) => tokens.includes(p.fcmToken) && (p.active = false));
  }
  async delete(id) {
    const b = this.items.length;
    this.items = this.items.filter((p) => p.id !== id);
    return this.items.length < b;
  }
}

export const makeCert = (o = {}) =>
  new Certification({
    id: uuid(),
    title: 'AWS Cloud Practitioner',
    issuer: 'Amazon',
    category: 'Cloud',
    issueDate: '2024-03-01',
    ...o,
  });
export const makeAward = (o = {}) =>
  new Award({
    id: uuid(),
    title: 'Bourse',
    organization: 'Fondation',
    type: 'scholarship',
    amount: 1000,
    currency: 'CAD',
    awardedAt: '2024-06-01',
    ...o,
  });

export class MemoryContactRepo {
  constructor() {
    this.items = [];
  }
  async create(m) {
    this.items.push({ id: uuid(), lu: false, ...m });
  }
}

import VideoSeries from '../../src/domain/entities/VideoSeries.js';
import Video from '../../src/domain/entities/Video.js';

/** Séries et vidéos en mémoire (mêmes règles que la base : slug unique, positions). */
export class MemoryVideoStore {
  constructor() {
    this.series = [];
    this.videos = [];
    this.views = {};
  }
  get seriesRepo() {
    const st = this;
    const attach = (s) =>
      s
        ? new VideoSeries({
            ...s,
            videos: st.videos
              .filter((v) => v.seriesId === s.id)
              .sort((a, b) => a.position - b.position),
          })
        : null;
    return {
      list: async ({ includeDrafts = false } = {}) =>
        st.series.filter((s) => includeDrafts || s.status === 'published').map(attach),
      findBySlug: async (slug) => attach(st.series.find((s) => s.slug === slug)),
      findById: async (id) => attach(st.series.find((s) => s.id === id)),
      create: async (dto) => {
        if (st.series.some((s) => s.slug === dto.slug))
          throw new Error('duplicate key value violates unique constraint');
        const s = new VideoSeries({ id: uuid(), ...dto });
        st.series.push(s);
        return s;
      },
      update: async (id, dto) => {
        const i = st.series.findIndex((s) => s.id === id);
        if (i < 0) return null;
        st.series[i] = new VideoSeries({ ...st.series[i], ...dto });
        return st.series[i];
      },
      delete: async (id) => {
        const b = st.series.length;
        st.series = st.series.filter((s) => s.id !== id);
        st.videos = st.videos.filter((v) => v.seriesId !== id);
        return st.series.length < b;
      },
    };
  }
  get videoRepo() {
    const st = this;
    return {
      findById: async (id) => st.videos.find((v) => v.id === id) || null,
      nextPosition: async (sid) =>
        Math.max(
          0,
          ...st.videos.filter((v) => v.seriesId === sid).map((v) => v.position)
        ) + 1,
      create: async (dto) => {
        if (st.videos.some((v) => v.seriesId === dto.seriesId && v.slug === dto.slug))
          throw new Error('duplicate key value violates unique constraint');
        const v = new Video({ id: uuid(), ...dto });
        st.videos.push(v);
        return v;
      },
      update: async (id, dto) => {
        const i = st.videos.findIndex((v) => v.id === id);
        if (i < 0) return null;
        st.videos[i] = new Video({ ...st.videos[i], ...dto });
        return st.videos[i];
      },
      delete: async (id) => {
        const b = st.videos.length;
        st.videos = st.videos.filter((v) => v.id !== id);
        return st.videos.length < b;
      },
      incrementViews: async (id) => {
        const v = st.videos.find((x) => x.id === id);
        if (v && v.status === 'published') v.views += 1;
        st.views[id] = (st.views[id] || 0) + 1;
      },
      reorder: async (sid, ids) => {
        const own = st.videos.filter((v) => v.seriesId === sid);
        if (
          ids.length !== own.length ||
          new Set(ids).size !== ids.length ||
          !ids.every((i) => own.some((v) => v.id === i))
        )
          throw new Error(
            'Ordre invalide : la liste doit contenir exactement les vidéos de la série'
          );
        ids.forEach((id, i) => (st.videos.find((v) => v.id === id).position = i + 1));
      },
    };
  }
  addSeries(o = {}) {
    const s = new VideoSeries({
      id: uuid(),
      title: 'Série React',
      slug: 'react-avance',
      status: 'published',
      category: 'React',
      level: 'intermediate',
      tags: ['hooks', 'Redux'],
      ...o,
    });
    this.series.push(s);
    return s;
  }
  addVideo(series, o = {}) {
    const position =
      o.position ?? this.videos.filter((v) => v.seriesId === series.id).length + 1;
    const v = new Video({
      id: uuid(),
      seriesId: series.id,
      title: `Vidéo ${position}`,
      slug: `video-${position}`,
      videoKey: `videos/${series.slug}/0${position}-video-${position}.mp4`,
      posterKey: `posters/${series.slug}/0${position}-video-${position}.jpg`,
      durationSeconds: 1500,
      position,
      status: 'published',
      ...o,
    });
    this.videos.push(v);
    return v;
  }
}

export class FakeStorage {
  constructor() {
    this.files = new Map();
    this.removed = [];
    this.uploads = [];
  }
  async exists(key) {
    return this.files.has(key) ? { size: this.files.get(key) } : null;
  }
  async remove(key) {
    if (this.failRemove) throw new Error('S3 down');
    this.removed.push(key);
    this.files.delete(key);
  }
  async createUploadUrl(key, type, expires) {
    this.uploads.push({ key, type, expires });
    return `https://s3.example/${key}?sig=1&expires=${expires}`;
  }
}
