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
