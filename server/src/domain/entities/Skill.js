export default class Skill {
  constructor({ id, name, level, icon = null, sortOrder = 0 }) {
    Object.assign(this, { id, name, level, icon, sortOrder: sortOrder ?? 0 });
  }
}
