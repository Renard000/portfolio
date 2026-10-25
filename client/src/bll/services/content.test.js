import ContentService from './ContentService.js';
import ContactService from './ContactService.js';
import * as siteContent from '../../domain/content/siteContent.js';

const P = [
  {
    slug: 'a',
    title: 'Plateforme de réservation',
    category: 'Web',
    summary: 'Réserver',
    tech: ['React', 'Node'],
  },
  { slug: 'b', title: 'App santé', category: 'Mobile', summary: 'Suivi', tech: ['PWA'] },
  {
    slug: 'c',
    title: 'Tableau de bord',
    category: 'Web',
    summary: 'Données',
    tech: ['D3'],
  },
];

describe('ContentService', () => {
  it('snapshot / getAll renvoient profil et projets', async () => {
    const s = new ContentService(siteContent);
    expect(s.snapshot().profile.name).toBe(siteContent.profile.name);
    expect((await s.getAll()).projects).toBe(siteContent.projects);
  });
  it('catégories distinctes dans l’ordre d’apparition', () => {
    expect(ContentService.categories(P)).toEqual(['Web', 'Mobile']);
  });
  it('filtre par catégorie, "all" et vide = tout', () => {
    expect(
      ContentService.filterProjects(P, { category: 'Web' }).map((p) => p.slug)
    ).toEqual(['a', 'c']);
    expect(ContentService.filterProjects(P, { category: 'all' })).toHaveLength(3);
    expect(ContentService.filterProjects(P, {})).toHaveLength(3);
  });
  it('recherche sans accents dans titre, résumé, catégorie et technologies', () => {
    expect(
      ContentService.filterProjects(P, { q: 'reservation' }).map((p) => p.slug)
    ).toEqual(['a']);
    expect(ContentService.filterProjects(P, { q: 'pwa' }).map((p) => p.slug)).toEqual([
      'b',
    ]);
    expect(ContentService.filterProjects(P, { q: 'zzz' })).toEqual([]);
    expect(
      ContentService.filterProjects(P, { category: 'Web', q: 'données' }).map(
        (p) => p.slug
      )
    ).toEqual(['c']);
  });
  it('findBySlug et next (en boucle, null s’il n’y a qu’un projet)', () => {
    expect(ContentService.findBySlug(P, 'b').title).toBe('App santé');
    expect(ContentService.findBySlug(P, 'x')).toBeNull();
    expect(ContentService.next(P, 'a').slug).toBe('b');
    expect(ContentService.next(P, 'c').slug).toBe('a');
    expect(ContentService.next([P[0]], 'a')).toBeNull();
    expect(ContentService.next(P, 'x')).toBeNull();
  });
  it('le fichier de contenu est complet : slugs uniques, champs requis', () => {
    const slugs = siteContent.projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of siteContent.projects) {
      for (const k of [
        'slug',
        'title',
        'category',
        'summary',
        'challenge',
        'solution',
        'color',
      ])
        expect(p[k], `${p.slug}.${k}`).toBeTruthy();
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
    for (const s of siteContent.profile.skills)
      (expect(s.level).toBeGreaterThanOrEqual(0),
        expect(s.level).toBeLessThanOrEqual(100));
  });
});

describe('ContactService (client)', () => {
  it('validate : nom, courriel et message de 10 caractères minimum', () => {
    expect(Object.keys(ContactService.validate({}))).toEqual(['nom', 'email', 'message']);
    expect(
      ContactService.validate({ nom: 'Ada', email: 'a@b.co', message: '1234567890' })
    ).toEqual({});
    expect(
      ContactService.validate({ nom: 'Ada', email: 'a@b.co', message: 'court' }).message
    ).toMatch(/10 caractères/);
  });
  it('refuse sans appeler l’API', async () => {
    const repo = { send: vi.fn() };
    await expect(
      new ContactService(repo).send({ nom: '', email: 'x', message: 'y' })
    ).rejects.toThrow();
    expect(repo.send).not.toHaveBeenCalled();
  });
  it('envoie les champs nettoyés, honeypot compris', async () => {
    const repo = { send: vi.fn().mockResolvedValue({}) };
    await new ContactService(repo).send({
      nom: ' Ada ',
      email: ' a@b.co ',
      sujet: ' Hi ',
      message: ' un message assez long ',
      website: 'bot',
    });
    expect(repo.send).toHaveBeenCalledWith({
      nom: 'Ada',
      email: 'a@b.co',
      sujet: 'Hi',
      message: 'un message assez long',
      website: 'bot',
    });
  });
});
