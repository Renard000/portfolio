import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicationSubject from '../../src/bll/events/PublicationSubject.js';
import Publication, {
  PUBLICATION_LABELS,
} from '../../src/domain/entities/Publication.js';
import CertificationService from '../../src/bll/services/CertificationService.js';
import AwardService from '../../src/bll/services/AwardService.js';
import ProjectService from '../../src/bll/services/ProjectService.js';
import VideoService from '../../src/bll/services/VideoService.js';
import { contentEmail } from '../../src/bll/emails.js';
import Certification from '../../src/domain/entities/Certification.js';
import Award from '../../src/domain/entities/Award.js';
import Project from '../../src/domain/entities/Project.js';
import { MemoryCrudRepo, MemoryVideoStore, FakeStorage } from '../helpers/fakes.js';

const logger = { log: vi.fn(), error: vi.fn() };
const pub = new Publication({
  kind: 'project',
  id: 'p1',
  title: 'T',
  path: '/projets/t',
});

beforeEach(() => vi.clearAllMocks());

describe('PublicationSubject (Observer)', () => {
  const observer = (channel, result = { sent: 1, failed: 0, deactivated: 0 }) => ({
    channel,
    onPublication: vi.fn().mockResolvedValue(result),
  });

  it('prévient tous les abonnés et regroupe les résultats par canal', async () => {
    const subject = new PublicationSubject({ logger });
    const [a, b] = [observer('email'), observer('push')];
    subject.subscribe(a);
    subject.subscribe(b);
    const r = await subject.notify(pub);
    expect(a.onPublication).toHaveBeenCalledWith(pub);
    expect(b.onPublication).toHaveBeenCalledWith(pub);
    expect(Object.keys(r)).toEqual(['email', 'push']);
  });

  it('un nouveau canal ne demande qu’un abonnement', async () => {
    const subject = new PublicationSubject({ logger });
    const webhook = observer('webhook');
    subject.subscribe(webhook);
    expect((await subject.notify(pub)).webhook.sent).toBe(1);
  });

  it('désabonnement : le canal n’est plus prévenu', async () => {
    const subject = new PublicationSubject({ logger });
    const a = observer('email');
    const unsubscribe = subject.subscribe(a);
    unsubscribe();
    await subject.notify(pub);
    expect(a.onPublication).not.toHaveBeenCalled();
  });

  it('une panne, même synchrone, n’empêche pas les autres et ne rejette jamais', async () => {
    const subject = new PublicationSubject({ logger });
    const ok = observer('push');
    subject.subscribe({
      channel: 'email',
      onPublication() {
        throw new Error('panne');
      },
    });
    subject.subscribe(ok);
    const r = await subject.notify(pub);
    expect(r.email.error).toBe(true);
    expect(r.push.sent).toBe(1);
    expect(logger.error).toHaveBeenCalledOnce();
  });
});

describe('Publication : un événement par type de contenu', () => {
  it.each([
    [Publication.fromArticle({ id: '1', title: 'A', slug: 'mon a' }), '/blog/mon%20a'],
    [Publication.fromSeries({ id: '2', title: 'S', slug: 's' }), '/formations/s'],
    [
      Publication.fromVideo({ id: '3', title: 'V', slug: 'v' }, { slug: 's' }),
      '/formations/s/v',
    ],
    [Publication.fromCertification({ id: '4', title: 'C' }), '/certifications'],
    [Publication.fromAward({ id: '5', title: 'D' }), '/distinctions'],
    [Publication.fromProject({ id: '6', title: 'P', slug: 'p' }), '/projets/p'],
  ])('%#', (p, path) => {
    expect(p.path).toBe(path);
    expect(p.label).toBe(PUBLICATION_LABELS[p.kind]);
    expect(p.url('https://site.ex')).toBe(`https://site.ex${path}`);
  });

  it('bas de courriel : identifie l’expéditeur, texte échappé', () => {
    const { html } = contentEmail({
      kind: 'article',
      title: 'T',
      url: 'https://site.ex/x',
      unsubscribeUrl: 'https://api.ex/u',
      sender: { name: 'Flo <b>', address: '1 rue X, Montréal', site: 'https://site.ex' },
    });
    expect(html).toContain('Flo &lt;b&gt; · 1 rue X, Montréal · https://site.ex');
    expect(html).toContain('Me désabonner');
  });

  it('chaque type a un courriel complet (objet et bouton)', () => {
    for (const kind of Object.keys(PUBLICATION_LABELS)) {
      const mail = contentEmail({
        kind,
        title: 'T',
        url: 'https://site.ex/x',
        unsubscribeUrl: 'https://api.ex/u',
      });
      expect(mail.subject).toBe(`${PUBLICATION_LABELS[kind]} : T`);
      expect(mail.html).not.toContain('undefined');
    }
  });
});

describe('Création d’un contenu : notification', () => {
  const cases = [
    [
      'certification',
      () => new CertificationService(new MemoryCrudRepo(Certification), notifier),
      { title: 'AWS', issuer: 'Amazon', issueDate: '2026-01-01' },
    ],
    [
      'award',
      () => new AwardService(new MemoryCrudRepo(Award), notifier),
      { title: 'Prix', organization: 'Org', awardedAt: '2026-01-01' },
    ],
    [
      'project',
      () => new ProjectService(new MemoryCrudRepo(Project), notifier),
      { title: 'Finova', slug: 'finova' },
    ],
  ];
  let notifier;
  beforeEach(() => {
    notifier = {
      notify: vi.fn().mockResolvedValue({}),
      retract: vi.fn().mockResolvedValue(),
    };
  });

  it.each(cases)(
    '%s : notifie une fois, sans enregistrer notify',
    async (kind, make, dto) => {
      const service = make();
      const created = await service.create({ ...dto, notify: true });
      expect(notifier.notify).toHaveBeenCalledOnce();
      expect(notifier.notify.mock.calls[0][0]).toMatchObject({ kind, id: created.id });
      expect(created).not.toHaveProperty('notify');
    }
  );

  it.each(cases)('%s : notify=false n’écrit à personne', async (_kind, make, dto) => {
    await make().create({ ...dto, notify: false });
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it.each(cases)('%s : modifier ne renotifie pas', async (_kind, make, dto) => {
    const service = make();
    const created = await service.create(dto);
    notifier.notify.mockClear();
    await service.update(created.id, { title: 'Modifié' });
    expect(notifier.notify).not.toHaveBeenCalled();
  });
});

describe('Série de formation : passage en ligne', () => {
  let store, notifier, service;
  beforeEach(() => {
    store = new MemoryVideoStore();
    notifier = {
      notify: vi.fn().mockResolvedValue({}),
      retract: vi.fn().mockResolvedValue(),
    };
    service = new VideoService(
      store.seriesRepo,
      store.videoRepo,
      new FakeStorage(),
      notifier
    );
  });

  it('brouillon → publiée avec des vidéos publiées : notifie la formation', async () => {
    const series = store.addSeries({ status: 'draft' });
    store.addVideo(series, { status: 'published' });
    await service.updateSeries(series.id, { status: 'published' });
    expect(notifier.notify).toHaveBeenCalledOnce();
    expect(notifier.notify.mock.calls[0][0].kind).toBe('series');
  });

  it('série sans vidéo publiée (invisible) : aucune notification', async () => {
    const series = store.addSeries({ status: 'draft' });
    await service.updateSeries(series.id, { status: 'published' });
    expect(notifier.notify).not.toHaveBeenCalled();
  });

  it('sort=recent : les séries ajoutées en dernier d’abord', async () => {
    for (const [slug, createdAt] of [
      ['ancienne', '2026-01-01T00:00:00Z'],
      ['recente', '2026-10-01T00:00:00Z'],
    ]) {
      const s = store.addSeries({
        slug,
        createdAt,
        sortOrder: slug === 'recente' ? 9 : 0,
      });
      store.addVideo(s, { status: 'published' });
    }
    const { items } = await service.listSeries({ sort: 'recent', limit: 1 });
    expect(items[0].slug).toBe('recente');
  });

  it('série déjà publiée : modifier ne renotifie pas', async () => {
    const series = store.addSeries();
    store.addVideo(series, { status: 'published' });
    await service.updateSeries(series.id, { title: 'Nouveau titre' });
    expect(notifier.notify).not.toHaveBeenCalled();
  });
});
