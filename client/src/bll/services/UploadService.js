const RULES = {
  image: {
    bucket: 'images',
    types: ['image/png', 'image/jpeg', 'image/webp'],
    max: 5 * 1024 * 1024,
  },
  document: { bucket: 'documents', types: ['application/pdf'], max: 10 * 1024 * 1024 },
};

/** Valide le fichier puis l'envoie dans le bon bucket Supabase (images / documents). */
export default class UploadService {
  constructor(authClient, uuid = () => crypto.randomUUID()) {
    this.authClient = authClient;
    this.uuid = uuid;
  }

  static validate(file, kind) {
    const rule = RULES[kind];
    if (!rule) return 'Type de fichier inconnu.';
    if (!rule.types.includes(file.type))
      return kind === 'image'
        ? 'Image PNG, JPEG ou WebP requise.'
        : 'Fichier PDF requis.';
    if (file.size > rule.max)
      return `Fichier trop volumineux (maximum ${rule.max / 1024 / 1024} Mo).`;
    return null;
  }

  /** Nom sûr : minuscules, sans accents ni caractères spéciaux. */
  static safeName(name) {
    const base = String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+\./g, '.') // pas de tiret juste avant l'extension
      .replace(/\.{2,}/g, '.') // pas de « .. »
      .replace(/^[-.]+|-+$/g, '');
    return base || 'fichier';
  }

  async upload(file, kind, folder = 'misc') {
    const error = UploadService.validate(file, kind);
    if (error) throw new Error(error);
    const path = `${folder}/${this.uuid()}-${UploadService.safeName(file.name)}`;
    return this.authClient.uploadImage(file, path, RULES[kind].bucket);
  }
}
