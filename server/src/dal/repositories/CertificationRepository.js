import Certification from '../../domain/entities/Certification.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'certifications';

const fromRow = (r) =>
  new Certification({
    id: r.id,
    title: r.title,
    issuer: r.issuer,
    category: r.category,
    description: r.description,
    issueDate: r.issue_date,
    expiryDate: r.expiry_date,
    credentialId: r.credential_id,
    credentialUrl: r.credential_url,
    imageUrl: r.image_url,
    documentUrl: r.document_url,
    skills: r.skills,
    featured: r.featured,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  });

const toRow = (d) => {
  const map = {
    title: 'title',
    issuer: 'issuer',
    category: 'category',
    description: 'description',
    issueDate: 'issue_date',
    expiryDate: 'expiry_date',
    credentialId: 'credential_id',
    credentialUrl: 'credential_url',
    imageUrl: 'image_url',
    documentUrl: 'document_url',
    skills: 'skills',
    featured: 'featured',
    sortOrder: 'sort_order',
  };
  const row = {};
  for (const [k, col] of Object.entries(map)) if (d[k] !== undefined) row[col] = d[k];
  return row;
};

export default class CertificationRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async list() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('issue_date', { ascending: false })
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

  /** Renvoie true si une ligne a été supprimée. */
  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
