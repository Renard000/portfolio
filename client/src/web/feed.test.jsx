import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { renderApp, makeServices, makeFeedService, CERTS } from './testUtils.jsx';
import FeedService from '../bll/services/FeedService.js';
import AdminAlertService from '../bll/services/AdminAlertService.js';
import { toastDismissed } from './store/slices/feedSlice.js';

const ARTICLE = {
  id: 'p1',
  kind: 'article',
  refId: 'a1',
  title: 'Redux sans hooks',
  path: '/blog/redux-sans-hooks',
  publishedAt: '2026-10-29T10:00:00Z',
};
const CERT = {
  id: 'p2',
  kind: 'certification',
  refId: 'c2',
  title: 'Scrum Master',
  path: '/certifications',
  publishedAt: '2026-10-29T10:00:00Z',
};

const nav = () => screen.getByRole('navigation', { name: 'Navigation principale' });
const link = (name) => within(nav()).getByRole('link', { name });

describe('Nouveautés du visiteur', () => {
  it('point rouge sur la page concernée, badge NEW sur la carte de l’accueil', async () => {
    const services = makeServices({ feedService: makeFeedService([ARTICLE]) });
    renderApp('/', services);
    expect(
      await within(nav()).findByRole('link', { name: /^Blog\s*nouveautés$/ })
    ).toBeTruthy();
    expect(await screen.findByText('NEW')).toBeInTheDocument();
    expect(link('Formations')).toBeInTheDocument();
  });

  it('ouvrir la page retire le point ; le badge reste jusqu’à l’ouverture', async () => {
    const services = makeServices({ feedService: makeFeedService([ARTICLE]) });
    renderApp('/', services);
    fireEvent.click(
      await within(nav()).findByRole('link', { name: /^Blog\s*nouveautés$/ })
    );
    await waitFor(() => expect(link('Blog')).toBeInTheDocument());
    expect(await screen.findAllByText('NEW')).not.toHaveLength(0);
    expect(services.feedService.saveSeen).toHaveBeenCalled();
  });

  it('ouvrir la publication depuis l’accueil retire point et badge', async () => {
    const services = makeServices({ feedService: makeFeedService([ARTICLE]) });
    renderApp('/', services);
    await screen.findByText('NEW');
    fireEvent.click(
      screen.getByRole('link', { name: /Lire l’article Redux sans hooks/ })
    );
    await waitFor(() => expect(link('Blog')).toBeInTheDocument());
    expect(screen.queryByText('NEW')).toBeNull();
  });

  it('une certification est vue à l’ouverture de son détail', async () => {
    const services = makeServices({ feedService: makeFeedService([CERT]) });
    renderApp('/certifications', services);
    await screen.findByText('NEW');
    const card = screen.getByText('NEW').closest('article');
    fireEvent.click(within(card).getByRole('button', { name: 'Voir le détail' }));
    await waitFor(() => expect(screen.queryByText('NEW')).toBeNull());
  });

  it('déjà vue pendant une visite précédente : ni point ni badge', async () => {
    const services = makeServices({
      feedService: makeFeedService([ARTICLE], { items: { p1: true } }),
    });
    renderApp('/', services);
    await screen.findByText('Dernières certifications');
    await waitFor(() => expect(services.feedService.list).toHaveBeenCalled());
    expect(screen.queryByText('NEW')).toBeNull();
    expect(link('Blog')).toBeInTheDocument();
  });

  it('temps réel : alerte, son et point rouge sans recharger la page', async () => {
    const feedService = makeFeedService();
    const services = makeServices({ feedService });
    renderApp('/', services);
    await screen.findByText('Dernières certifications');
    act(() => feedService.publish(CERT));
    expect(await screen.findByText('Nouvelle certification')).toBeInTheDocument();
    expect(services.soundClient.play).toHaveBeenCalledOnce();
    expect(
      within(nav()).getByRole('link', { name: /^Certifications\s*nouveautés$/ })
    ).toBeTruthy();
  });

  it('son coupé : alerte sans son, et le choix est mémorisé', async () => {
    const feedService = makeFeedService();
    const services = makeServices({ feedService });
    renderApp('/', services);
    await screen.findByText('Dernières certifications');
    fireEvent.click(
      screen.getByRole('button', { name: 'Couper le son des notifications' })
    );
    expect(feedService.saveSeen).toHaveBeenLastCalledWith(
      expect.objectContaining({ muted: true })
    );
    act(() => feedService.publish(CERT));
    await screen.findByText('Nouvelle certification');
    expect(services.soundClient.play).not.toHaveBeenCalled();
  });

  it('dans l’admin : pas d’alerte sur ses propres publications', async () => {
    const feedService = makeFeedService();
    const services = makeServices({ feedService });
    services.authClient.getSession.mockResolvedValue({ user: { email: 'a@b.c' } });
    renderApp('/admin/certifications', services);
    await screen.findByRole('heading', { name: 'Certifications' });
    act(() => feedService.publish(CERT));
    expect(screen.queryByText('Nouvelle certification')).toBeNull();
  });
});

describe('Alertes de l’admin', () => {
  it('nouveau message : alerte, son et liste rechargée ; arrêt à la déconnexion', async () => {
    const services = makeServices();
    const stop = vi.fn();
    let listener;
    services.adminAlertService.subscribe = vi.fn((callback) => {
      listener = callback;
      return stop;
    });
    services.authClient.getSession.mockResolvedValue({ user: { email: 'a@b.c' } });
    renderApp('/admin', services);
    await screen.findByRole('heading', { name: 'Tableau de bord' });
    await waitFor(() =>
      expect(services.adminAlertService.subscribe).toHaveBeenCalledOnce()
    );
    const before = services.adminContentService.listMessages.mock.calls.length;
    act(() =>
      listener('messages', {
        title: 'Nouveau message',
        text: 'Grace : Mandat',
        to: '/admin/messages',
      })
    );
    expect(await screen.findByText('Grace : Mandat')).toBeInTheDocument();
    expect(services.soundClient.play).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(services.adminContentService.listMessages.mock.calls.length).toBe(before + 1)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    await waitFor(() => expect(stop).toHaveBeenCalledOnce());
  });

  it('AdminAlertService : un message clair par table', () => {
    const handlers = {};
    const service = new AdminAlertService({
      onInsert: (table, cb) => {
        handlers[table] = cb;
        return () => {};
      },
    });
    const received = [];
    service.subscribe((table, alert) => received.push([table, alert.title, alert.text]));
    handlers.messages({ nom: 'Grace', sujet: 'Mandat' });
    handlers.comments({ author: 'Bob' });
    handlers.subscribers({ email: 'a@b.c' });
    expect(received).toEqual([
      ['messages', 'Nouveau message', 'Grace : Mandat'],
      ['comments', 'Nouveau commentaire à modérer', 'Bob'],
      ['subscribers', 'Nouvelle inscription à la newsletter', 'a@b.c'],
    ]);
  });
});

describe('Admin : courriels', () => {
  const logged = () => {
    const s = makeServices();
    s.authClient.getSession.mockResolvedValue({ user: { email: 'a@b.c' } });
    return s;
  };

  it('modifier un modèle, aperçu réel dans un cadre isolé', async () => {
    const services = logged();
    renderApp('/admin/courriels', services);
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle vidéo' }));
    const subject = await screen.findByLabelText('Objet du courriel');
    expect(subject).toHaveValue('Nouvelle vidéo : {{titre}}');
    fireEvent.change(subject, { target: { value: 'Vidéo : {{titre}}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.emailAdminService.saveTemplate).toHaveBeenCalledWith(
        'video',
        expect.objectContaining({ subject: 'Vidéo : {{titre}}' })
      )
    );
    expect(await screen.findByText('Modèle enregistré.')).toBeInTheDocument();
    const frame = await screen.findByTitle('Aperçu du courriel');
    expect(frame).toHaveAttribute('sandbox', '');
  });

  it('news : confirmation obligatoire avant l’envoi à tous', async () => {
    const services = logged();
    renderApp('/admin/courriels', services);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Envoyer à tous les abonnés' })
    );
    expect(services.emailAdminService.broadcast).not.toHaveBeenCalled();
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Envoyer' })
    );
    await waitFor(() =>
      expect(services.emailAdminService.broadcast).toHaveBeenCalledOnce()
    );
    expect(await screen.findByText(/2 réussi/)).toBeInTheDocument();
  });
});

describe('BLL et DAL des nouveautés', () => {
  const seen = { items: {}, sections: {}, muted: false };

  it('newIndex : la visite de la page retire le point, pas le badge', () => {
    const visited = FeedService.visit(seen, [ARTICLE], '/blog', new Date('2026-10-30'));
    const index = FeedService.newIndex([ARTICLE], visited);
    expect(index.dots).toEqual({});
    expect(FeedService.isNew(index, { path: ARTICLE.path })).toBe(true);
  });

  it('une publication plus récente que la visite relance le point', () => {
    const visited = FeedService.visit(seen, [], '/blog', new Date('2026-10-01'));
    expect(FeedService.newIndex([ARTICLE], visited).dots).toEqual({ '/blog': true });
  });

  it('ouvrir une formation couvre ses vidéos ; l’accueil ne marque rien', () => {
    const video = { ...ARTICLE, id: 'v', kind: 'video', path: '/formations/s/v1' };
    expect(FeedService.visit(seen, [video], '/formations/s').items).toEqual({ v: true });
    expect(FeedService.visit(seen, [video], '/')).toBe(seen);
  });

  it('isNew par préfixe : la carte d’une formation signale ses nouvelles vidéos', () => {
    const video = { ...ARTICLE, id: 'v', kind: 'video', path: '/formations/s/v1' };
    const index = FeedService.newIndex([video], seen);
    expect(FeedService.isNew(index, { prefix: '/formations/s' })).toBe(true);
    expect(FeedService.isNew(index, { prefix: '/formations/autre' })).toBe(false);
  });

  it('les toasts se ferment', () => {
    expect(toastDismissed('x').type).toBe('feed/toastDismissed');
    expect(CERTS.length).toBeGreaterThan(0);
  });
});
