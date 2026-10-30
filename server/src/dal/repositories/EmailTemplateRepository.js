import { unwrap } from '../unwrap.js';

const TABLE = 'email_templates';

const fromRow = (r) => ({
  key: r.key,
  subject: r.subject,
  heading: r.heading,
  body: r.body,
  ctaLabel: r.cta_label,
  updatedAt: r.updated_at,
});

export default class EmailTemplateRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async list() {
    return unwrap(await this.supabase.from(TABLE).select('*')).map(fromRow);
  }

  async findByKey(key) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('key', key).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async upsert(key, { subject, heading, body, ctaLabel = null }) {
    return fromRow(
      unwrap(
        await this.supabase
          .from(TABLE)
          .upsert({
            key,
            subject,
            heading,
            body,
            cta_label: ctaLabel,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      )
    );
  }

  async delete(key) {
    unwrap(await this.supabase.from(TABLE).delete().eq('key', key));
  }
}
