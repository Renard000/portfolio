import { NotFoundError } from '../../domain/errors/index.js';
import { DEFAULT_TEMPLATES, SAMPLE_VARIABLES } from '../emailTemplates.js';
import { renderEmail } from '../emails.js';

const SAMPLE_URL = 'https://exemple.com';

/** Modèles de courriel : ceux du code, remplacés par ceux modifiés dans l'admin. */
export default class EmailTemplateService {
  constructor(emailTemplateRepository, emailClient, { sender } = {}) {
    this.repo = emailTemplateRepository;
    this.emailClient = emailClient;
    this.sender = sender;
  }

  static #defaultOf(key) {
    const template = DEFAULT_TEMPLATES[key];
    if (!template) throw new NotFoundError('Modèle introuvable');
    return template;
  }

  /** Modèle à utiliser ; une panne de lecture retombe sur celui du code. */
  async get(key) {
    const base = EmailTemplateService.#defaultOf(key);
    try {
      const saved = await this.repo.findByKey(key);
      return saved ? { ...base, ...saved, customized: true } : base;
    } catch {
      return base;
    }
  }

  async list() {
    const saved = await this.repo.list();
    const byKey = new Map(saved.map((t) => [t.key, t]));
    return Object.entries(DEFAULT_TEMPLATES).map(([key, base]) => ({
      ...base,
      ...byKey.get(key),
      key,
      customized: byKey.has(key),
    }));
  }

  async save(key, dto) {
    EmailTemplateService.#defaultOf(key);
    return this.repo.upsert(key, dto);
  }

  /** Revient au modèle par défaut. */
  async reset(key) {
    EmailTemplateService.#defaultOf(key);
    await this.repo.delete(key);
    return { ...DEFAULT_TEMPLATES[key], key, customized: false };
  }

  #render(key, dto) {
    return renderEmail(
      { ...EmailTemplateService.#defaultOf(key), ...dto },
      SAMPLE_VARIABLES,
      {
        sender: this.sender,
        url: SAMPLE_URL,
      }
    );
  }

  preview(key, dto) {
    const { subject, html } = this.#render(key, dto);
    return { subject, html };
  }

  async sendTest(key, dto, to) {
    const { subject, html, text } = this.#render(key, dto);
    await this.emailClient.send({ to, subject: `[Test] ${subject}`, html, text });
  }
}
