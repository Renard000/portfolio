import { createStore } from './store.js';
import {
  fetchCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  setFilter,
  resetFilters,
  setView,
} from './slices/certificationsSlice.js';
import {
  fetchAwards,
  createAward,
  deleteAward,
  setActiveType,
} from './slices/awardsSlice.js';
import { subscribeNewsletter, enablePush } from './slices/newsletterSlice.js';
import { restoreSession, signIn, signOut } from './slices/authSlice.js';
import {
  fetchSubscribers,
  removeNewsletterSubscriber,
  removePushSubscriber,
  sendTestEmail,
} from './slices/subscribersSlice.js';
import {
  selectVisibleCertifications,
  selectFeaturedCertifications,
  selectCertificationFacets,
  selectAwardGroups,
  selectVisibleAwardTotals,
} from './selectors.js';

const cert = (o) => ({
  id: 'x',
  title: 'T',
  issuer: 'I',
  category: 'C',
  issueDate: '2024-01-01',
  skills: [],
  ...o,
});

function setup(overrides = {}) {
  const services = {
    certificationService: {
      list: vi
        .fn()
        .mockResolvedValue([
          cert({ id: '1', featured: true }),
          cert({ id: '2', issuer: 'Z', issueDate: '2025-01-01' }),
        ]),
      create: vi.fn(async (d) => ({ id: '3', ...d })),
      update: vi.fn(async (id, d) => ({ id, ...d })),
      remove: vi.fn().mockResolvedValue(null),
    },
    awardService: {
      list: vi.fn().mockResolvedValue({
        items: [
          {
            id: 'a',
            type: 'scholarship',
            amount: 100,
            currency: 'CAD',
            awardedAt: '2024-01-01',
          },
          { id: 'b', type: 'merit', awardedAt: '2023-01-01' },
        ],
        totals: { count: 2, scholarshipAmounts: { CAD: 100 } },
      }),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn(),
      remove: vi.fn().mockResolvedValue(null),
    },
    newsletterService: { subscribe: vi.fn().mockResolvedValue({ status: 'pending' }) },
    pushService: { enable: vi.fn().mockResolvedValue('subscribed') },
    authClient: {
      getSession: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockResolvedValue({ user: { email: 'a@b.co' } }),
      signOut: vi.fn().mockResolvedValue(),
    },
    subscriberAdminService: {
      list: vi.fn().mockResolvedValue({
        newsletter: [{ id: 'n1', email: 'a@b.co' }],
        push: [{ id: 'p1', token: 'abc…' }],
      }),
      removeNewsletter: vi.fn().mockResolvedValue(),
      removePush: vi.fn().mockResolvedValue(),
      sendTestEmail: vi.fn().mockResolvedValue(),
    },
    ...overrides,
  };
  return { services, store: createStore(services) };
}

describe('certificationsSlice', () => {
  it('charge via le service injecté (loading → données)', async () => {
    const { store, services } = setup();
    const p = store.dispatch(fetchCertifications());
    expect(store.getState().certifications.loading).toBe(true);
    await p;
    expect(services.certificationService.list).toHaveBeenCalled();
    expect(store.getState().certifications).toMatchObject({
      loading: false,
      loaded: true,
    });
    expect(store.getState().certifications.items).toHaveLength(2);
  });
  it('erreur API → message exposé', async () => {
    const { store } = setup({
      certificationService: { list: vi.fn().mockRejectedValue(new Error('Réseau')) },
    });
    await store.dispatch(fetchCertifications());
    expect(store.getState().certifications.error).toBe('Réseau');
    expect(store.getState().certifications.loading).toBe(false);
  });
  it('filtres, vue et sélecteurs (filtrés, vedettes, facettes)', async () => {
    const { store } = setup();
    await store.dispatch(fetchCertifications());
    expect(selectVisibleCertifications(store.getState()).map((c) => c.id)).toEqual([
      '2',
      '1',
    ]);
    store.dispatch(setFilter({ issuer: 'Z' }));
    expect(selectVisibleCertifications(store.getState()).map((c) => c.id)).toEqual(['2']);
    store.dispatch(resetFilters());
    expect(store.getState().certifications.filters.issuer).toBe('');
    expect(selectFeaturedCertifications(store.getState()).map((c) => c.id)).toEqual([
      '1',
    ]);
    expect(selectCertificationFacets(store.getState()).issuers).toEqual(['I', 'Z']);
    store.dispatch(setView('carousel'));
    expect(store.getState().certifications.view).toBe('carousel');
    store.dispatch(setView('nimporte'));
    expect(store.getState().certifications.view).toBe('grid');
  });
  it('sélecteur mémoïsé : même référence si rien ne change', async () => {
    const { store } = setup();
    await store.dispatch(fetchCertifications());
    expect(selectVisibleCertifications(store.getState())).toBe(
      selectVisibleCertifications(store.getState())
    );
  });
  it('create / update / delete mettent à jour la liste', async () => {
    const { store } = setup();
    await store.dispatch(fetchCertifications());
    await store.dispatch(createCertification({ title: 'N' }));
    expect(store.getState().certifications.items).toHaveLength(3);
    await store.dispatch(updateCertification({ id: '1', dto: { title: 'Modif' } }));
    expect(store.getState().certifications.items.find((c) => c.id === '1').title).toBe(
      'Modif'
    );
    await store.dispatch(deleteCertification('2'));
    expect(store.getState().certifications.items.map((c) => c.id)).not.toContain('2');
  });
  it('échec de création : saveError renseignée', async () => {
    const { store } = setup({
      certificationService: {
        create: vi.fn().mockRejectedValue(new Error('Données invalides')),
      },
    });
    await store.dispatch(createCertification({}));
    expect(store.getState().certifications.saveError).toBe('Données invalides');
    expect(store.getState().certifications.saving).toBe(false);
  });
});

describe('awardsSlice', () => {
  it("charge items et totaux, groupe par année, totaux de l'onglet actif", async () => {
    const { store } = setup();
    await store.dispatch(fetchAwards());
    const s = store.getState();
    expect(s.awards.totals).toEqual({ count: 2, scholarshipAmounts: { CAD: 100 } });
    expect(selectAwardGroups(s).map((g) => g.year)).toEqual([2024, 2023]);
    store.dispatch(setActiveType('merit'));
    expect(selectVisibleAwardTotals(store.getState())).toEqual({
      count: 1,
      scholarshipAmounts: {},
    });
  });
  it('create et delete rechargent la liste', async () => {
    const { store, services } = setup();
    await store.dispatch(createAward({ title: 'x' }));
    expect(services.awardService.create).toHaveBeenCalled();
    expect(services.awardService.list).toHaveBeenCalledTimes(1);
    await store.dispatch(deleteAward('a'));
    expect(services.awardService.list).toHaveBeenCalledTimes(2);
  });
});

describe('newsletter, push, auth, abonnés', () => {
  it('newsletter : loading → pending ; erreur de validation → error', async () => {
    const { store } = setup();
    const p = store.dispatch(subscribeNewsletter({ email: 'a@b.co', consent: true }));
    expect(store.getState().newsletter.status).toBe('loading');
    await p;
    expect(store.getState().newsletter.status).toBe('pending');
    const bad = setup({
      newsletterService: {
        subscribe: vi.fn().mockRejectedValue(new Error('Adresse courriel invalide.')),
      },
    });
    await bad.store.dispatch(subscribeNewsletter({}));
    expect(bad.store.getState().newsletter).toMatchObject({
      status: 'error',
      error: 'Adresse courriel invalide.',
    });
  });
  it('push : subscribed / unavailable / error', async () => {
    const a = setup();
    await a.store.dispatch(enablePush());
    expect(a.store.getState().newsletter.push).toBe('subscribed');
    const b = setup({
      pushService: { enable: vi.fn().mockResolvedValue('unavailable') },
    });
    await b.store.dispatch(enablePush());
    expect(b.store.getState().newsletter.push).toBe('unavailable');
    const c = setup({
      pushService: { enable: vi.fn().mockRejectedValue(new Error('x')) },
    });
    await c.store.dispatch(enablePush());
    expect(c.store.getState().newsletter.push).toBe('error');
  });
  it('auth : session absente → ready sans utilisateur ; connexion ; message vague si échec ; déconnexion', async () => {
    const { store } = setup();
    await store.dispatch(restoreSession());
    expect(store.getState().auth).toMatchObject({ ready: true, user: null });
    await store.dispatch(signIn({ email: 'a@b.co', password: 'x' }));
    expect(store.getState().auth.user).toEqual({ email: 'a@b.co' });
    await store.dispatch(signOut());
    expect(store.getState().auth.user).toBeNull();
    const bad = setup({
      authClient: {
        signIn: vi
          .fn()
          .mockRejectedValue(new Error('Invalid login credentials: user not found')),
      },
    });
    await bad.store.dispatch(signIn({ email: 'x', password: 'y' }));
    expect(bad.store.getState().auth.error).toBe('Identifiants invalides.');
  });
  it('abonnés : liste, suppression des deux types, courriel de test', async () => {
    const { store, services } = setup();
    await store.dispatch(fetchSubscribers());
    expect(store.getState().subscribers.newsletter).toHaveLength(1);
    await store.dispatch(removeNewsletterSubscriber('n1'));
    await store.dispatch(removePushSubscriber('p1'));
    expect(store.getState().subscribers.newsletter).toHaveLength(0);
    expect(store.getState().subscribers.push).toHaveLength(0);
    await store.dispatch(sendTestEmail('me@x.co'));
    expect(services.subscriberAdminService.sendTestEmail).toHaveBeenCalledWith('me@x.co');
    expect(store.getState().subscribers.testStatus).toBe('sent');
  });
});
