import Project from '../../domain/entities/Project.js';
import { unwrap } from '../unwrap.js';
import { toColumns } from '../columns.js';

const TABLE = 'projects';

const COLUMNS = {
  slug: 'slug',
  title: 'title',
  category: 'category',
  summary: 'summary',
  description: 'description',
  challenge: 'challenge',
  solution: 'solution',
  role: 'role',
  duration: 'duration',
  year: 'year',
  tech: 'tech',
  results: 'results',
  githubUrl: 'github_url',
  liveUrl: 'live_url',
  imageUrl: 'image_url',
  color: 'color',
  featured: 'featured',
  sortOrder: 'sort_order',
};

const fromRow = (r) =>
  new Project({
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category,
    summary: r.summary,
    description: r.description,
    challenge: r.challenge,
    solution: r.solution,
    role: r.role,
    duration: r.duration,
    year: r.year,
    tech: r.tech,
    results: r.results,
    githubUrl: r.github_url,
    liveUrl: r.live_url,
    imageUrl: r.image_url,
    color: r.color,
    featured: r.featured,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  });

export default class ProjectRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async list() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
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
      unwrap(
        await this.supabase.from(TABLE).insert(toColumns(dto, COLUMNS)).select().single()
      )
    );
  }

  async update(id, dto) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update(toColumns(dto, COLUMNS))
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
