const text = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};

export default class EmailAdminService {
  constructor(emailAdminRepository) {
    this.repo = emailAdminRepository;
  }

  listTemplates() {
    return this.repo.listTemplates();
  }
  saveTemplate(key, values) {
    return this.repo.saveTemplate(key, EmailAdminService.toDto(values));
  }
  resetTemplate(key) {
    return this.repo.resetTemplate(key);
  }
  previewTemplate(key, values) {
    return this.repo.previewTemplate(key, EmailAdminService.toDto(values));
  }
  testTemplate(key, values, to) {
    return this.repo.testTemplate(key, { ...EmailAdminService.toDto(values), to });
  }

  replyDraft(id) {
    return this.repo.replyDraft(id);
  }
  reply(id, dto) {
    return this.repo.reply(id, dto);
  }

  broadcast(values) {
    return this.repo.broadcast({
      ...EmailAdminService.toDto(values),
      ctaUrl: text(values.ctaUrl),
    });
  }

  static validate(values) {
    if (!String(values.subject || '').trim()) return 'L’objet est obligatoire.';
    if (!String(values.heading || '').trim()) return 'Le titre est obligatoire.';
    if (!String(values.body || '').trim()) return 'Le texte est obligatoire.';
    return null;
  }

  static toDto(values) {
    return {
      subject: String(values.subject || '').trim(),
      heading: String(values.heading || '').trim(),
      body: String(values.body || '').trim(),
      ctaLabel: text(values.ctaLabel),
    };
  }
}
