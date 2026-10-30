import { screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { renderApp, makeServices } from './testUtils.jsx';
import ProgressService from '../bll/services/ProgressService.js';
import { MemoryProgressRepo } from './testUtils.jsx';

beforeEach(() => {
  window.matchMedia = () => ({ matches: true });
  vi.restoreAllMocks();
});
afterEach(() => {
  delete window.matchMedia;
});

const SERIES = [
  {
    id: 's1',
    slug: 'react-avance',
    title: 'React avancé',
    category: 'React',
    level: 'intermediate',
    videoCount: 3,
    totalDurationSeconds: 7200,
    posterUrl: null,
    language: 'fr',
  },
  {
    id: 's2',
    slug: 'node-api',
    title: 'API Node',
    category: 'Node',
    level: 'beginner',
    videoCount: 1,
    totalDurationSeconds: 600,
    posterUrl: 'https://cdn.ex/posters/a.jpg',
    language: 'fr',
  },
];
const V = (n, o = {}) => ({
  id: `v${n}`,
  seriesId: 's1',
  title: `Vidéo ${n}`,
  slug: `v${n}`,
  description: null,
  durationSeconds: 1500,
  formattedDuration: '25:00',
  position: n,
  chapters: [],
  resources: [],
  views: 0,
  posterUrl: null,
  ...o,
});
const SERIES_DETAIL = {
  ...SERIES[0],
  description: 'Hooks, Redux et plus.',
  videos: [V(1), V(2), V(3)],
};
const withVideos = (over = {}) =>
  makeServices({
    videoService: {
      listSeries: vi.fn().mockResolvedValue({ items: SERIES, total: 2, page: 1 }),
      getSeries: vi.fn().mockResolvedValue(SERIES_DETAIL),
      getVideo: vi.fn(),
      getPlayback: vi.fn(),
      registerView: vi.fn().mockResolvedValue(),
      ...over,
    },
  });

describe('Accueil : « Dernières formations »', () => {
  it('affiche le bandeau avec les 3 dernières séries (limit=3)', async () => {
    const services = withVideos();
    renderApp('/', services);
    expect(
      await screen.findByRole('heading', { name: 'Dernières formations' })
    ).toBeInTheDocument();
    expect(services.videoService.listSeries).toHaveBeenCalledWith({
      limit: 3,
      sort: 'recent',
    });
    expect(screen.getByRole('link', { name: 'Série React avancé' })).toHaveAttribute(
      'href',
      '/formations/react-avance'
    );
  });
  it('sans série : la section reste visible avec un message', async () => {
    renderApp('/');
    expect(
      await screen.findByText('Aucune formation publiée pour l’instant.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Dernières formations' })
    ).toBeInTheDocument();
  });
});

describe('Page /formations', () => {
  it('liste les séries : niveau, nombre de vidéos et durée totale', async () => {
    renderApp('/formations', withVideos());
    const card = await screen.findByRole('link', { name: 'Série React avancé' });
    expect(card).toHaveTextContent('Intermédiaire');
    expect(card).toHaveTextContent('3 vidéos · 2 h 00');
    expect(screen.getByRole('link', { name: 'Série API Node' })).toHaveTextContent(
      '1 vidéo · 10 min'
    );
  });
  it('filtre par catégorie et par niveau (envoyés au serveur)', async () => {
    const services = withVideos();
    renderApp('/formations', services);
    await screen.findByRole('link', { name: 'Série React avancé' });
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Catégories' })).getByRole('button', {
        name: 'Node',
      })
    );
    await waitFor(() =>
      expect(services.videoService.listSeries).toHaveBeenLastCalledWith({
        category: 'Node',
      })
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Niveau' })).getByRole('button', {
        name: 'Avancé',
      })
    );
    await waitFor(() =>
      expect(services.videoService.listSeries).toHaveBeenLastCalledWith({
        category: 'Node',
        level: 'advanced',
      })
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Niveau' })).getByRole('button', {
        name: 'Avancé',
      })
    ); // décocher
    await waitFor(() =>
      expect(services.videoService.listSeries).toHaveBeenLastCalledWith({
        category: 'Node',
      })
    );
  });
  it('les catégories restent proposées après filtrage (liste non filtrée mémorisée)', async () => {
    const services = withVideos();
    renderApp('/formations', services);
    await screen.findByRole('link', { name: 'Série React avancé' });
    services.videoService.listSeries.mockResolvedValue({
      items: [SERIES[1]],
      total: 1,
      page: 1,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Node' }));
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: 'Série React avancé' })).toBeNull()
    );
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
  });
  it('la recherche est retardée : une seule requête pour une saisie rapide', async () => {
    const services = withVideos();
    renderApp('/formations', services);
    await screen.findByRole('link', { name: 'Série React avancé' });
    services.videoService.listSeries.mockClear();
    const input = screen.getByLabelText('Rechercher une série');
    for (const v of ['r', 're', 'rea', 'reac'])
      fireEvent.change(input, { target: { value: v } });
    expect(services.videoService.listSeries).not.toHaveBeenCalled();
    await waitFor(
      () => expect(services.videoService.listSeries).toHaveBeenCalledTimes(1),
      { timeout: 1500 }
    );
    expect(services.videoService.listSeries).toHaveBeenCalledWith({ q: 'reac' });
  });
  it('aucun résultat et erreur réseau annoncés', async () => {
    renderApp(
      '/formations',
      withVideos({
        listSeries: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1 }),
      })
    );
    expect(await screen.findByText(/Aucune série ne correspond/)).toBeInTheDocument();
    renderApp(
      '/formations',
      withVideos({ listSeries: vi.fn().mockRejectedValue(new Error('API indisponible')) })
    );
    expect(await screen.findByText('API indisponible')).toBeInTheDocument();
  });
});

describe("Page d'une série", () => {
  const progressWith = (watched) => {
    const p = new ProgressService(new MemoryProgressRepo());
    watched.forEach((id) => p.markWatched(id, 1500));
    return p;
  };
  it('description, durée totale, vidéos ordonnées avec durées', async () => {
    renderApp('/formations/react-avance', withVideos());
    expect(
      await screen.findByRole('heading', { level: 1, name: 'React avancé' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hooks, Redux et plus.')).toBeInTheDocument();
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Vidéo 1');
    expect(items[0]).toHaveTextContent('25:00');
  });
  it('progression : coches « vue », pourcentage et bouton « Reprendre » vers la première non vue', async () => {
    renderApp(
      '/formations/react-avance',
      withVideos({}) &&
        makeServices({ ...withVideos(), progressService: progressWith(['v1']) })
    );
    await screen.findByRole('heading', { level: 1, name: 'React avancé' });
    expect(
      await screen.findByRole('progressbar', { name: 'Progression' })
    ).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByLabelText('Vue')).toBeInTheDocument();
    const resume = screen.getByRole('link', { name: /Reprendre : vidéo 2/ });
    expect(resume).toHaveAttribute('href', '/formations/react-avance/v2');
  });
  it('aucune vidéo vue : « Commencer » ; tout vu : « Série terminée »', async () => {
    renderApp('/formations/react-avance', withVideos());
    expect(
      await screen.findByRole('link', { name: /Commencer : vidéo 1/ })
    ).toBeInTheDocument();
    renderApp(
      '/formations/react-avance',
      makeServices({ ...withVideos(), progressService: progressWith(['v1', 'v2', 'v3']) })
    );
    expect(await screen.findByText(/Série terminée/)).toBeInTheDocument();
  });
  it('série introuvable : message et retour à la liste', async () => {
    renderApp(
      '/formations/inconnue',
      withVideos({ getSeries: vi.fn().mockRejectedValue(new Error('Série introuvable')) })
    );
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /introuvable/
    );
    expect(screen.getByRole('link', { name: /Toutes les formations/ })).toHaveAttribute(
      'href',
      '/formations'
    );
  });
});

// ---------------- Lecteur ----------------
const PLAYER = (n = 2, over = {}) => ({
  series: { title: 'React avancé', slug: 'react-avance' },
  video: V(n, {
    chapters: [
      { t: 0, label: 'Introduction' },
      { t: 300, label: 'Le lecteur' },
      { t: 900, label: 'Conclusion' },
    ],
    resources: [{ label: 'Dépôt GitHub', url: 'https://github.com/x/y' }],
    description: 'Description de la vidéo.',
    ...over,
  }),
  previous: n > 1 ? { slug: `v${n - 1}`, title: `Vidéo ${n - 1}` } : null,
  next: n < 3 ? { slug: `v${n + 1}`, title: `Vidéo ${n + 1}` } : null,
});

function playerServices({ progress, getPlayback, getVideo } = {}) {
  let k = 0;
  return makeServices({
    ...withVideos(),
    progressService: progress || new ProgressService(new MemoryProgressRepo()),
    videoService: {
      listSeries: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1 }),
      getSeries: vi.fn(),
      getVideo:
        getVideo || vi.fn(async (_s, slug) => PLAYER(Number(slug.replace('v', '')))),
      getPlayback:
        getPlayback ||
        vi.fn(async (id) => ({
          url: `https://cdn.ex/videos/${id}.mp4?Signature=sig${++k}`,
          expiresAt: '2099-01-01T00:00:00Z',
        })),
      registerView: vi.fn().mockResolvedValue(),
    },
  });
}
const videoEl = (container) => container.querySelector('video');
const openPlayer = async (
  services = playerServices(),
  path = '/formations/react-avance/v2'
) => {
  const r = renderApp(path, services);
  await waitFor(() => expect(videoEl(r.container).getAttribute('src')).toBeTruthy());
  return { ...r, video: videoEl(r.container) };
};

describe('Lecteur vidéo', () => {
  it("demande l'URL SIGNÉE à l'API et la met dans le <video> ; titre, ressources, précédente/suivante", async () => {
    const services = playerServices();
    const loadSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'load');
    const { video } = await openPlayer(services);
    expect(services.videoService.getPlayback).toHaveBeenCalledWith('v2');
    expect(video.getAttribute('src')).toContain('Signature=');
    expect(loadSpy).toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Vidéo 2' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dépôt GitHub/ })).toHaveAttribute(
      'rel',
      expect.stringContaining('noopener')
    );
    expect(screen.getByRole('link', { name: /Précédente/ })).toHaveAttribute(
      'href',
      '/formations/react-avance/v1'
    );
    expect(screen.getByRole('link', { name: /Suivante/ })).toHaveAttribute(
      'href',
      '/formations/react-avance/v3'
    );
  });
  it('dissuasion : aucun téléchargement, ni cast, ni picture-in-picture ; clic droit bloqué', async () => {
    const { video } = await openPlayer();
    expect(video.getAttribute('controlsList')).toBe('nodownload noremoteplayback');
    expect(video.hasAttribute('disablePictureInPicture')).toBe(true);
    expect(video.hasAttribute('disableRemotePlayback')).toBe(true);
    expect(video.hasAttribute('controls')).toBe(true);
    expect(document.querySelector('a[download]')).toBeNull();
    const e = new Event('contextmenu', { bubbles: true, cancelable: true });
    video.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(document.body.textContent).not.toMatch(/videos\/v2\.mp4|video_key|videoKey/);
  });
  it("l'URL signée n'est JAMAIS écrite dans localStorage ni sessionStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { video } = await openPlayer();
    fireEvent.timeUpdate(video);
    fireEvent.pause(video);
    for (const [, value] of setItem.mock.calls)
      expect(String(value)).not.toContain('Signature');
    expect(Object.keys(localStorage).join()).not.toContain('Signature');
  });
  it('reprise : replace la lecture à la position enregistrée au chargement des métadonnées', async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    progress.savePosition('v2', 600, 1500);
    const { video } = await openPlayer(playerServices({ progress }));
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(600);
    fireEvent.loadedMetadata(video); // la reprise ne se rejoue pas
    video.currentTime = 40;
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(40);
  });
  it('pas de reprise pour une vidéo déjà vue', async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    progress.markWatched('v2', 1500);
    const { video } = await openPlayer(playerServices({ progress }));
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(0);
  });
  it('position enregistrée au plus toutes les 5 secondes pendant timeupdate, et à la pause', async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    const save = vi.spyOn(progress, 'savePosition');
    const { video } = await openPlayer(playerServices({ progress }));
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const tick = (t) => {
      video.currentTime = t;
      fireEvent.timeUpdate(video);
    };
    tick(10);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    now += 2000;
    tick(12);
    now += 2000;
    tick(14);
    expect(save).toHaveBeenCalledTimes(1);
    now += 1500;
    tick(16);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save).toHaveBeenLastCalledWith('v2', 16, 1500);
    now += 100;
    video.currentTime = 20;
    fireEvent.pause(video);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(3));
    expect(save).toHaveBeenLastCalledWith('v2', 20, 1500);
  });
  it('chapitres : le courant est surligné au fil de la lecture ; un clic déplace la lecture', async () => {
    const { video } = await openPlayer();
    const nav = screen.getByRole('complementary', { name: 'Chapitres' });
    const current = () =>
      within(nav)
        .getAllByRole('button')
        .filter((b) => b.getAttribute('aria-current') === 'true')
        .map((b) => b.textContent);
    video.currentTime = 10;
    fireEvent.timeUpdate(video);
    expect(current()[0]).toContain('Introduction');
    video.currentTime = 450;
    fireEvent.timeUpdate(video);
    expect(current()[0]).toContain('Le lecteur');
    fireEvent.click(within(nav).getByRole('button', { name: /Conclusion/ }));
    expect(video.currentTime).toBe(900);
  });
  it('le chapitre courant est amené en vue (Ref + scrollIntoView)', async () => {
    const scroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scroll;
    const { video } = await openPlayer();
    video.currentTime = 450;
    fireEvent.timeUpdate(video);
    expect(scroll).toHaveBeenCalled();
    delete window.HTMLElement.prototype.scrollIntoView;
  });
  it('raccourcis : espace, ←/→ ±10 s, + / − vitesse', async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play');
    const pause = vi.spyOn(window.HTMLMediaElement.prototype, 'pause');
    const { video } = await openPlayer();
    Object.defineProperty(video, 'duration', { value: 1500, configurable: true });
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(play).toHaveBeenCalled();
    Object.defineProperty(video, 'paused', { value: false, configurable: true });
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(pause).toHaveBeenCalled();
    video.currentTime = 100;
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(video.currentTime).toBe(110);
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(video.currentTime).toBe(90);
    video.currentTime = 3;
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(video.currentTime).toBe(0);
    fireEvent.keyDown(document.body, { key: '+' });
    expect(video.playbackRate).toBe(1.25);
    fireEvent.keyDown(document.body, { key: '+' });
    fireEvent.keyDown(document.body, { key: '+' });
    fireEvent.keyDown(document.body, { key: '+' });
    expect(video.playbackRate).toBe(2); // plafonné
    fireEvent.keyDown(document.body, { key: '-' });
    expect(video.playbackRate).toBe(1.5);
    expect(screen.getByRole('button', { name: '1,5×' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
  it('plein écran avec F quand le navigateur le permet', async () => {
    const { video } = await openPlayer();
    video.requestFullscreen = vi.fn();
    fireEvent.keyDown(document.body, { key: 'f' });
    expect(video.requestFullscreen).toHaveBeenCalled();
  });
  it('les raccourcis sont ignorés quand on tape dans un champ, ou avec Ctrl/Cmd', async () => {
    const { video } = await openPlayer();
    const input = document.createElement('input');
    document.body.appendChild(input);
    video.currentTime = 100;
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight', ctrlKey: true });
    expect(video.currentTime).toBe(100);
    input.remove();
  });
  it("la barre d'espace sur un bouton ou un lien ne déclenche pas aussi la lecture", async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play');
    await openPlayer();
    fireEvent.keyDown(screen.getByRole('link', { name: /Suivante/ }), { key: ' ' });
    expect(play).not.toHaveBeenCalled();
  });
  it("vitesse choisie à la souris appliquée à l'élément", async () => {
    const { video } = await openPlayer();
    fireEvent.click(screen.getByRole('button', { name: '0,75×' }));
    expect(video.playbackRate).toBe(0.75);
  });
  it("statistique : la vue n'est comptée qu'une fois par vidéo chargée", async () => {
    const services = playerServices();
    const { video } = await openPlayer(services);
    fireEvent.play(video);
    fireEvent.play(video);
    fireEvent.play(video);
    await waitFor(() =>
      expect(services.videoService.registerView).toHaveBeenCalledTimes(1)
    );
    expect(services.videoService.registerView).toHaveBeenCalledWith('v2');
  });
  it('fin de vidéo : marquée « vue » et proposition de la suivante', async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    const { video } = await openPlayer(playerServices({ progress }));
    fireEvent.ended(video);
    expect(await screen.findByText(/Vidéo terminée/)).toBeInTheDocument();
    expect(progress.isWatched('v2')).toBe(true);
    expect(
      screen.getByRole('link', { name: /Vidéo suivante : Vidéo 3/ })
    ).toHaveAttribute('href', '/formations/react-avance/v3');
    fireEvent.play(video);
    await waitFor(() => expect(screen.queryByText(/Vidéo terminée/)).toBeNull());
  });
  it('dernière vidéo : retour à la série à la fin', async () => {
    const { video } = await openPlayer(playerServices(), '/formations/react-avance/v3');
    fireEvent.ended(video);
    expect(
      await screen.findByText(/Dernière vidéo de la série terminée/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Vidéo suivante/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Retour à la série' })).toHaveAttribute(
      'href',
      '/formations/react-avance'
    );
  });
  it('erreur de lecture (URL expirée, 403) : nouvelle URL demandée et reprise à la même seconde', async () => {
    const services = playerServices();
    const { video } = await openPlayer(services);
    const firstSrc = video.getAttribute('src');
    video.currentTime = 321;
    fireEvent.error(video);
    await waitFor(() =>
      expect(services.videoService.getPlayback).toHaveBeenCalledTimes(2)
    );
    await waitFor(() => expect(video.getAttribute('src')).not.toBe(firstSrc));
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(321);
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('erreurs répétées : message clair, puis « Réessayer » relance la lecture', async () => {
    const services = playerServices();
    const { video } = await openPlayer(services);
    for (let i = 0; i < 3; i++) {
      fireEvent.error(video);
      await waitFor(() =>
        expect(
          services.videoService.getPlayback.mock.calls.length
        ).toBeGreaterThanOrEqual(Math.min(i + 2, 3))
      );
    }
    expect(await screen.findByText('La lecture a échoué.')).toBeInTheDocument();
    const before = services.videoService.getPlayback.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() =>
      expect(services.videoService.getPlayback.mock.calls.length).toBe(before + 1)
    );
    await waitFor(() => expect(screen.queryByText('La lecture a échoué.')).toBeNull());
  });
  it('un événement « error » sans source (retrait volontaire) est ignoré', async () => {
    const services = playerServices();
    const { video } = await openPlayer(services);
    video.removeAttribute('src');
    fireEvent.error(video);
    await act(async () => {});
    expect(services.videoService.getPlayback).toHaveBeenCalledTimes(1);
  });
  it("vidéo introuvable ou non publiée : message d'erreur, pas d'URL demandée", async () => {
    const services = playerServices({
      getVideo: vi.fn().mockRejectedValue(new Error('Vidéo introuvable')),
    });
    renderApp('/formations/react-avance/zzz', services);
    expect(await screen.findByRole('alert')).toHaveTextContent('Vidéo introuvable');
    expect(services.videoService.getPlayback).not.toHaveBeenCalled();
  });
  it("échec de la demande d'URL (503, limite 30/h) : message affiché", async () => {
    const services = playerServices({
      getPlayback: vi
        .fn()
        .mockRejectedValue(new Error('Trop de requêtes, réessayez plus tard')),
    });
    renderApp('/formations/react-avance/v2', services);
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de requêtes');
  });
  it('changer de vidéo réutilise le MÊME élément <video> (pas de recréation) avec une nouvelle source', async () => {
    const services = playerServices();
    const { video, container } = await openPlayer(services);
    const oldSrc = video.getAttribute('src');
    fireEvent.click(screen.getByRole('link', { name: /Suivante/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Vidéo 3' })
      ).toBeInTheDocument()
    );
    await waitFor(() => expect(videoEl(container).getAttribute('src')).not.toBe(oldSrc));
    expect(videoEl(container)).toBe(video);
    expect(services.videoService.getPlayback).toHaveBeenLastCalledWith('v3');
  });
  it('au changement de vidéo, la position de la précédente est enregistrée', async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    const save = vi.spyOn(progress, 'savePosition');
    const { video } = await openPlayer(playerServices({ progress }));
    video.currentTime = 777;
    fireEvent.click(screen.getByRole('link', { name: /Précédente/ }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('v2', 777, 1500));
  });
  it("au démontage : enregistre la position, retire la source et arrête le téléchargement, efface l'URL", async () => {
    const progress = new ProgressService(new MemoryProgressRepo());
    const save = vi.spyOn(progress, 'savePosition');
    const loadSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'load');
    const { video, unmount, store } = await openPlayer(playerServices({ progress }));
    video.currentTime = 99;
    loadSpy.mockClear();
    unmount();
    expect(save).toHaveBeenCalledWith('v2', 99, 1500);
    expect(video.hasAttribute('src')).toBe(false);
    expect(loadSpy).toHaveBeenCalled();
    expect(store.getState().videos.playback.url).toBeNull();
  });
  it('retire son écouteur clavier au démontage', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = await openPlayer();
    unmount();
    expect(remove.mock.calls.some((c) => c[0] === 'keydown')).toBe(true);
  });
  it("un lecteur en erreur de rendu est isolé par l'Error Boundary", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = {
      series: { title: 'S', slug: 's' },
      video: { ...V(2), chapters: null, resources: null },
      previous: null,
      next: null,
    };
    renderApp(
      '/formations/react-avance/v2',
      playerServices({ getVideo: vi.fn().mockResolvedValue(bad) })
    );
    expect(
      await screen.findByText(/Le lecteur ne peut pas être affiché/)
    ).toBeInTheDocument();
    spy.mockRestore();
  });
});
