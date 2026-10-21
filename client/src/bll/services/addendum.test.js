import CertificationService from './CertificationService.js';
import AwardService from './AwardService.js';
import NewsletterService from './NewsletterService.js';
import PushService from './PushService.js';
import UploadService from './UploadService.js';
import SubscriberAdminService from './SubscriberAdminService.js';
import { toCsv } from './CsvService.js';

const certs = [
  {
    id: 'a',
    title: 'Sécurité Réseau',
    issuer: 'Cisco',
    category: 'Sécurité',
    issueDate: '2022-01-01',
    skills: ['firewall'],
    featured: true,
  },
  {
    id: 'b',
    title: 'AWS Developer',
    issuer: 'Amazon',
    category: 'Cloud',
    issueDate: '2024-01-01',
    skills: ['Lambda'],
  },
  {
    id: 'c',
    title: 'Scrum Master',
    issuer: 'Scrum.org',
    category: 'Gestion',
    issueDate: '2023-01-01',
  },
];
const ids = (l) => l.map((x) => x.id);

describe('CertificationService (client)', () => {
  it('filtre par émetteur, catégorie, recherche sans accents', () => {
    expect(ids(CertificationService.filterAndSort(certs, { issuer: 'Amazon' }))).toEqual([
      'b',
    ]);
    expect(
      ids(CertificationService.filterAndSort(certs, { category: 'Gestion' }))
    ).toEqual(['c']);
    expect(ids(CertificationService.filterAndSort(certs, { q: 'securite' }))).toEqual([
      'a',
    ]);
    expect(ids(CertificationService.filterAndSort(certs, { q: 'LAMBDA' }))).toEqual([
      'b',
    ]);
    expect(CertificationService.filterAndSort(certs, { q: 'zzz' })).toEqual([]);
  });
  it("trie par date (récentes d'abord par défaut) sans muter la source", () => {
    const copy = [...certs];
    expect(ids(CertificationService.filterAndSort(certs, {}))).toEqual(['b', 'c', 'a']);
    expect(ids(CertificationService.filterAndSort(certs, { sort: 'date_asc' }))).toEqual([
      'a',
      'c',
      'b',
    ]);
    expect(certs).toEqual(copy);
  });
  it('facets : listes distinctes, triées', () => {
    expect(CertificationService.facets(certs)).toEqual({
      issuers: ['Amazon', 'Cisco', 'Scrum.org'],
      categories: ['Cloud', 'Gestion', 'Sécurité'],
    });
  });
  it('featured : seulement les vedettes', () => {
    expect(ids(CertificationService.featured(certs))).toEqual(['a']);
  });
  it('list accepte un tableau ou { items }', async () => {
    expect(
      await new CertificationService({ list: async () => certs }).list()
    ).toHaveLength(3);
    expect(
      await new CertificationService({ list: async () => ({ items: certs }) }).list()
    ).toHaveLength(3);
  });
  it('validate : champs obligatoires et cohérence des dates', () => {
    expect(
      CertificationService.validate({ title: '', issuer: 'x', issueDate: '2024-01-01' })
    ).toMatch(/titre/i);
    expect(
      CertificationService.validate({ title: 'x', issuer: ' ', issueDate: '2024-01-01' })
    ).toMatch(/émetteur/i);
    expect(
      CertificationService.validate({ title: 'x', issuer: 'y', issueDate: '' })
    ).toMatch(/obtention/i);
    expect(
      CertificationService.validate({
        title: 'x',
        issuer: 'y',
        issueDate: '2024-05-01',
        expiryDate: '2024-01-01',
      })
    ).toMatch(/expiration/i);
    expect(
      CertificationService.validate({ title: 'x', issuer: 'y', issueDate: '2024-01-01' })
    ).toBeNull();
  });
  it('toDto : vide → null, compétences dédoublonnées, nombres convertis, URL de fichier prioritaires', () => {
    const dto = CertificationService.toDto(
      {
        title: ' T ',
        issuer: 'I',
        category: '',
        description: ' ',
        issueDate: '2024-01-01',
        expiryDate: '',
        credentialId: 'X',
        credentialUrl: '',
        skills: 'a, b ,a,,',
        featured: 1,
        sortOrder: '3',
        imageUrl: 'old.png',
        documentUrl: '',
      },
      { imageUrl: 'https://new/img.png' }
    );
    expect(dto).toEqual({
      title: 'T',
      issuer: 'I',
      category: null,
      description: null,
      issueDate: '2024-01-01',
      expiryDate: null,
      credentialId: 'X',
      credentialUrl: null,
      imageUrl: 'https://new/img.png',
      documentUrl: null,
      skills: ['a', 'b'],
      featured: true,
      sortOrder: 3,
    });
  });
});

const awards = [
  {
    id: '1',
    type: 'scholarship',
    amount: 1000,
    currency: 'CAD',
    awardedAt: '2023-05-01',
  },
  {
    id: '2',
    type: 'scholarship',
    amount: 500.5,
    currency: 'CAD',
    awardedAt: '2024-05-01',
  },
  { id: '3', type: 'scholarship', amount: 200, currency: 'USD', awardedAt: '2024-02-01' },
  { id: '4', type: 'merit', amount: 9999, currency: 'CAD', awardedAt: '2024-09-01' },
  { id: '5', type: 'honor', amount: null, currency: 'CAD', awardedAt: '2021-01-01' },
];

describe('AwardService (client)', () => {
  it('filterByType : all ou un type', () => {
    expect(AwardService.filterByType(awards, 'all')).toHaveLength(5);
    expect(ids(AwardService.filterByType(awards, 'merit'))).toEqual(['4']);
  });
  it("groupByYear : années décroissantes, distinctions récentes d'abord", () => {
    const g = AwardService.groupByYear(awards);
    expect(g.map((x) => x.year)).toEqual([2024, 2023, 2021]);
    expect(ids(g[0].items)).toEqual(['4', '2', '3']);
  });
  it('computeTotals : nombre total, montants des BOURSES seulement par devise', () => {
    expect(AwardService.computeTotals(awards)).toEqual({
      count: 5,
      scholarshipAmounts: { CAD: 1500.5, USD: 200 },
    });
    expect(AwardService.computeTotals([])).toEqual({ count: 0, scholarshipAmounts: {} });
  });
  it('computeTotals évite 0,1 + 0,2 = 0,30000000000000004', () => {
    const t = AwardService.computeTotals([
      { type: 'scholarship', amount: 0.1, currency: 'CAD' },
      { type: 'scholarship', amount: 0.2, currency: 'CAD' },
    ]);
    expect(t.scholarshipAmounts.CAD).toBe(0.3);
  });
  it('list : tolère une réponse incomplète', async () => {
    expect(await new AwardService({ list: async () => null }).list()).toEqual({
      items: [],
      totals: { count: 0, scholarshipAmounts: {} },
    });
  });
  it('validate / toDto du formulaire', () => {
    expect(
      AwardService.validate({
        title: '',
        organization: 'o',
        awardedAt: '2024-01-01',
        amount: '',
      })
    ).toMatch(/titre/i);
    expect(
      AwardService.validate({
        title: 't',
        organization: 'o',
        awardedAt: '2024-01-01',
        amount: '-4',
      })
    ).toMatch(/montant/i);
    expect(
      AwardService.validate({
        title: 't',
        organization: 'o',
        awardedAt: '2024-01-01',
        amount: '',
      })
    ).toBeNull();
    const dto = AwardService.toDto({
      title: 't',
      type: 'scholarship',
      organization: 'o',
      description: '',
      amount: '1200.5',
      currency: 'cad',
      awardedAt: '2024-01-01',
      featured: false,
      sortOrder: '',
    });
    expect(dto).toMatchObject({
      amount: 1200.5,
      currency: 'CAD',
      description: null,
      sortOrder: 0,
    });
    expect(
      AwardService.toDto({
        title: 't',
        organization: 'o',
        awardedAt: '2024-01-01',
        amount: '',
        currency: '',
      })
    ).toMatchObject({ amount: null, currency: 'CAD' });
  });
});

describe('NewsletterService (client)', () => {
  it("refuse un courriel invalide ou l'absence de consentement, sans appeler l'API", async () => {
    const repo = { subscribe: vi.fn() };
    const s = new NewsletterService(repo);
    await expect(s.subscribe({ email: 'oups', consent: true })).rejects.toThrow(
      /courriel/i
    );
    await expect(s.subscribe({ email: 'a@b.co', consent: false })).rejects.toThrow(
      /accepter/i
    );
    expect(repo.subscribe).not.toHaveBeenCalled();
  });
  it('envoie email, consentement et honeypot', async () => {
    const repo = { subscribe: vi.fn().mockResolvedValue({ status: 'pending' }) };
    await new NewsletterService(repo).subscribe({
      email: ' a@b.co ',
      consent: true,
      website: 'bot',
    });
    expect(repo.subscribe).toHaveBeenCalledWith({
      email: 'a@b.co',
      consent: true,
      website: 'bot',
    });
  });
});

describe('PushService', () => {
  it('jeton obtenu → API ; permission refusée → unavailable sans appel', async () => {
    const repo = { subscribePush: vi.fn().mockResolvedValue({}) };
    expect(await new PushService({ getToken: async () => 'tok' }, repo).enable()).toBe(
      'subscribed'
    );
    expect(repo.subscribePush).toHaveBeenCalledWith('tok');
    repo.subscribePush.mockClear();
    expect(await new PushService({ getToken: async () => null }, repo).enable()).toBe(
      'unavailable'
    );
    expect(repo.subscribePush).not.toHaveBeenCalled();
  });
});

describe('UploadService', () => {
  const file = (type, size = 100, name = 'Mon Diplôme (final).PNG') => ({
    type,
    size,
    name,
  });
  it('valide type et taille', () => {
    expect(UploadService.validate(file('image/png'), 'image')).toBeNull();
    expect(UploadService.validate(file('image/gif'), 'image')).toMatch(/PNG/);
    expect(UploadService.validate(file('image/png', 6 * 1024 * 1024), 'image')).toMatch(
      /volumineux/
    );
    expect(UploadService.validate(file('application/pdf'), 'document')).toBeNull();
    expect(UploadService.validate(file('image/png'), 'document')).toMatch(/PDF/);
    expect(
      UploadService.validate(file('application/pdf', 11 * 1024 * 1024), 'document')
    ).toMatch(/10 Mo/);
  });
  it('safeName : minuscules, sans accents ni caractères spéciaux', () => {
    expect(UploadService.safeName('Mon Diplôme (final).PNG')).toBe(
      'mon-diplome-final.png'
    );
    expect(UploadService.safeName('../../etc/passwd')).toBe('etc-passwd');
    expect(UploadService.safeName('a..b.png')).toBe('a.b.png');
    expect(UploadService.safeName('???')).toBe('fichier');
  });
  it('envoie dans le bon bucket avec un chemin unique', async () => {
    const authClient = { uploadImage: vi.fn().mockResolvedValue('https://cdn/x') };
    const s = new UploadService(authClient, () => 'uuid-1');
    expect(
      await s.upload(
        file('application/pdf', 10, 'Attestation.pdf'),
        'document',
        'certifications'
      )
    ).toBe('https://cdn/x');
    expect(authClient.uploadImage).toHaveBeenCalledWith(
      expect.anything(),
      'certifications/uuid-1-attestation.pdf',
      'documents'
    );
    await s.upload(file('image/png', 10, 'b.png'), 'image', 'awards');
    expect(authClient.uploadImage.mock.calls[1][2]).toBe('images');
  });
  it("un fichier invalide n'est jamais envoyé", async () => {
    const authClient = { uploadImage: vi.fn() };
    await expect(
      new UploadService(authClient).upload(file('text/html'), 'image')
    ).rejects.toThrow();
    expect(authClient.uploadImage).not.toHaveBeenCalled();
  });
});

describe('SubscriberAdminService et CSV', () => {
  it('list normalise la réponse', async () => {
    expect(await new SubscriberAdminService({ list: async () => ({}) }).list()).toEqual({
      newsletter: [],
      push: [],
    });
  });
  it('toCsv : guillemets, virgules, retours ligne', () => {
    const csv = toCsv(
      [{ a: 'x,y', b: 'dit "oui"', c: 'l1\nl2' }],
      [
        { label: 'A', value: (r) => r.a },
        { label: 'B', value: (r) => r.b },
        { label: 'C', value: (r) => r.c },
      ]
    );
    expect(csv).toBe('A,B,C\r\n"x,y","dit ""oui""","l1\nl2"');
  });
  it("toCsv neutralise l'injection de formules (=, +, -, @)", () => {
    const csv = toCsv(
      [{ v: '=HYPERLINK("http://evil")' }, { v: '+1' }, { v: '@x' }, { v: 'ok' }],
      [{ label: 'V', value: (r) => r.v }]
    );
    const lines = csv.split('\r\n').slice(1);
    expect(lines[0].startsWith('"\'=')).toBe(true);
    expect(lines[1]).toBe("'+1");
    expect(lines[2]).toBe("'@x");
    expect(lines[3]).toBe('ok');
  });
});
