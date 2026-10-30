import Skill from '../../domain/entities/Skill.js';
import { unwrap } from '../unwrap.js';
import { toColumns } from '../columns.js';

const TABLE = 'skills';
const COLUMNS = { name: 'name', level: 'level', icon: 'icon', sortOrder: 'sort_order' };

const fromRow = (r) =>
  new Skill({
    id: r.id,
    name: r.name,
    level: r.level,
    icon: r.icon,
    sortOrder: r.sort_order,
  });

export default class SkillRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async list() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .order('sort_order', { ascending: true })
        .order('level', { ascending: false })
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
