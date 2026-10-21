import Award from '../../domain/entities/Award.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'awards';

const fromRow = (r) =>
  new Award({
    id: r.id,
    title: r.title,
    type: r.type,
    organization: r.organization,
    description: r.description,
    amount: r.amount,
    currency: r.currency,
    awardedAt: r.awarded_at,
    imageUrl: r.image_url,
    documentUrl: r.document_url,
    featured: r.featured,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  });

const toRow = (d) => {
  const map = {
    title: 'title',
    type: 'type',
    organization: 'organization',
    description: 'description',
    amount: 'amount',
    currency: 'currency',
    awardedAt: 'awarded_at',
    imageUrl: 'image_url',
    documentUrl: 'document_url',
    featured: 'featured',
    sortOrder: 'sort_order',
  };
  const row = {};
  for (const [k, col] of Object.entries(map)) if (d[k] !== undefined) row[col] = d[k];
  return row;
};

export default class AwardRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async list() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .order('awarded_at', { ascending: false })
        .order('sort_order', { ascending: true })
    );
    return data.map(fromRow);
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async create(dto) {
    return fromRow(
      unwrap(await this.supabase.from(TABLE).insert(toRow(dto)).select().single())
    );
  }

  async update(id, dto) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update(toRow(dto))
        .eq('id', id)
        .select()
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
