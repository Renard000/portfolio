/** Titres et descriptions des pages (onglet du navigateur et moteurs de recherche). */
export const SITE_NAME = 'Florwensky Paniague';

const DEFAULT = {
  title: 'Développeur full-stack à Montréal',
  description:
    'Portfolio de Florwensky Paniague, développeur full-stack à Montréal : projets web, mobiles et IA, blog, formations vidéo et certifications.',
};

const PAGES = {
  '/a-propos': {
    title: 'À propos',
    description: 'Parcours, compétences et façon de travailler de Florwensky Paniague.',
  },
  '/projets': {
    title: 'Projets',
    description: 'Projets web, mobiles et IA réalisés par Florwensky Paniague.',
  },
  '/blog': {
    title: 'Blog',
    description: 'Notes de terrain sur React, Node, l’architecture et le métier.',
  },
  '/formations': {
    title: 'Formations',
    description: 'Formations vidéo pour apprendre le développement, série par série.',
  },
  '/certifications': {
    title: 'Certifications',
    description: 'Certifications obtenues par Florwensky Paniague.',
  },
  '/distinctions': {
    title: 'Distinctions',
    description: 'Bourses, mérites, prix et honneurs de Florwensky Paniague.',
  },
  '/contact': {
    title: 'Contact',
    description: 'Un mandat, une collaboration, une question : écrivez-moi.',
  },
  '/conditions': { title: 'Conditions d’utilisation' },
  '/confidentialite': { title: 'Politique de confidentialité' },
};

/** Métadonnées d'une adresse ; les pages de détail les précisent ensuite elles-mêmes. */
export function metaForPath(pathname) {
  if (pathname.startsWith('/admin')) return { title: 'Administration', noindex: true };
  if (pathname.startsWith('/newsletter')) return { title: 'Newsletter', noindex: true };
  const section = Object.keys(PAGES).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return section ? { ...DEFAULT, ...PAGES[section] } : DEFAULT;
}
