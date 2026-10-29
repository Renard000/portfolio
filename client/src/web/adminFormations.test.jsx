import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, makeServices } from './testUtils.jsx';

beforeEach(() => {
  window.matchMedia = () => ({ matches: true });
});
afterEach(() => {
  delete window.matchMedia;
});

const LIST = [
  {
    id: 's1',
    slug: 'react-avance',
    title: 'React avancé',
    category: 'React',
    level: 'intermediate',
    status: 'published',
    featured: false,
    videoCount: 3,
    publishedCount: 2,
    totalDurationSeconds: 4500,
  },
];
const FULL = (n, o = {}) => ({
  id: `v${n}`,
  seriesId: 's1',
  title: `Vidéo ${n}`,
  slug: `video-${n}`,
  description: 'Desc',
  videoKey: `videos/react-avance/0${n}-video-${n}.mp4`,
  posterKey: null,
  sizeBytes: 5e8,
  durationSeconds: 1500,
  position: n,
  chapters: [
    { t: 0, label: 'Intro' },
    { t: 300, label: 'Suite' },
  ],
  resources: [{ label: 'Dépôt', url: 'https://g.co/x' }],
  status: n === 3 ? 'draft' : 'published',
  views: 10 * n,
  ...o,
});
const DETAIL = {
  id: 's1',
  slug: 'react-avance',
  title: 'React avancé',
  videos: [FULL(1), FULL(2), FULL(3)],
};

function adminServices(over = {}) {
  const s = makeServices();
  s.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
  s.videoAdminService = {
    listSeries: vi.fn().mockResolvedValue(LIST),
    getSeries: vi.fn().mockResolvedValue(DETAIL),
    createSeries: vi.fn().mockResolvedValue({ id: 'new' }),
    updateSeries: vi.fn().mockResolvedValue({}),
    deleteSeries: vi.fn().mockResolvedValue(null),
    createVideo: vi.fn().mockResolvedValue({}),
    updateVideo: vi.fn().mockResolvedValue({}),
    deleteVideo: vi.fn().mockResolvedValue(null),
    orderVideos: vi.fn(async (_id, ids) => ({
      ...DETAIL,
      videos: ids.map((id, i) => ({
        ...DETAIL.videos.find((v) => v.id === id),
        position: i + 1,
      })),
    })),
    uploadFile: vi.fn().mockResolvedValue('videos/react-avance/04-nouvelle.mp4'),
    ...over,
  };
  return s;
}

describe('Admin : séries de formation', () => {
  it("lien « Formations » dans l'admin ; tableau avec publiées/total et durée publiée", async () => {
    renderApp('/admin/formations', adminServices());
    expect(await screen.findByRole('link', { name: 'React avancé' })).toHaveAttribute(
      'href',
      '/admin/formations/s1'
    );
    expect(
      screen
        .getAllByRole('link', { name: 'Formations' })
        .some((a) => a.getAttribute('href') === '/admin/formations')
    ).toBe(true);
    const row = screen.getByRole('link', { name: 'React avancé' }).closest('tr');
    expect(row).toHaveTextContent('Intermédiaire');
    expect(row).toHaveTextContent('Publiée');
    expect(row).toHaveTextContent('2/3');
    expect(row).toHaveTextContent('1 h 15');
  });
  it('création : le slug est proposé à partir du titre (accents retirés) ; validation', async () => {
    const services = adminServices();
    renderApp('/admin/formations', services);
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Le titre est obligatoire.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'Sécurité Web & API !' },
    });
    expect(screen.getByLabelText(/^Slug/)).toHaveValue('securite-web-api');
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'securite' } });
    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'Sécurité Web' },
    });
    expect(screen.getByLabelText(/^Slug/)).toHaveValue('securite'); // slug modifié à la main : plus écrasé
    fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: 'advanced' } });
    fireEvent.change(screen.getByLabelText(/Étiquettes/), {
      target: { value: 'xss, csrf, xss' },
    });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'published' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.videoAdminService.createSeries).toHaveBeenCalled()
    );
    expect(services.videoAdminService.createSeries.mock.calls[0][0]).toMatchObject({
      title: 'Sécurité Web',
      slug: 'securite',
      level: 'advanced',
      tags: ['xss', 'csrf'],
      status: 'published',
      language: 'fr',
    });
    await waitFor(() =>
      expect(services.videoAdminService.listSeries).toHaveBeenCalledTimes(2)
    ); // rechargement
  });
  it('slug invalide refusé avant tout appel', async () => {
    const services = adminServices();
    renderApp('/admin/formations', services);
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'Pas Valide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText(/Slug invalide/)).toBeInTheDocument();
    expect(services.videoAdminService.createSeries).not.toHaveBeenCalled();
  });
  it('erreur serveur (slug déjà utilisé) affichée dans le formulaire', async () => {
    renderApp(
      '/admin/formations',
      adminServices({
        createSeries: vi
          .fn()
          .mockRejectedValue(new Error('Ce slug de série est déjà utilisé')),
      })
    );
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'React avancé' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(
      await screen.findByText('Ce slug de série est déjà utilisé')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('modification préremplie ; suppression avec confirmation', async () => {
    const services = adminServices();
    renderApp('/admin/formations', services);
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier React avancé' }));
    expect(screen.getByLabelText(/^Titre/)).toHaveValue('React avancé');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer React avancé' }));
    expect(screen.getByRole('dialog', { name: /Confirmer/ })).toHaveTextContent(
      'React avancé'
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.videoAdminService.deleteSeries).toHaveBeenCalledWith('s1')
    );
  });
});

describe("Admin : vidéos d'une série", () => {
  const open = async (services = adminServices()) => {
    const r = renderApp('/admin/formations/s1', services);
    await screen.findByRole('heading', { name: 'React avancé' });
    return { ...r, services };
  };
  it('liste avec durée mm:ss, statut et vues ; premier « monter » et dernier « descendre » désactivés', async () => {
    await open();
    const row = screen.getByText('Vidéo 3').closest('tr');
    expect(row).toHaveTextContent('25:00');
    expect(row).toHaveTextContent('Brouillon');
    expect(screen.getByText('Vidéo 2').closest('tr')).toHaveTextContent('20');
    expect(screen.getByRole('button', { name: 'Monter Vidéo 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descendre Vidéo 3' })).toBeDisabled();
  });
  it("réordonner : envoie la liste complète des ids avec les deux vidéos échangées, puis met à jour l'affichage", async () => {
    const { services } = await open();
    fireEvent.click(screen.getByRole('button', { name: 'Descendre Vidéo 1' }));
    await waitFor(() =>
      expect(services.videoAdminService.orderVideos).toHaveBeenCalledWith('s1', [
        'v2',
        'v1',
        'v3',
      ])
    );
    await waitFor(() =>
      expect(screen.getAllByRole('row')[1]).toHaveTextContent('Vidéo 2')
    );
  });
  it("suppression d'une vidéo : confirmation qui prévient de la suppression du fichier S3", async () => {
    const { services } = await open();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Vidéo 2' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      /fichier S3 sera aussi supprimé/
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.videoAdminService.deleteVideo).toHaveBeenCalledWith('v2')
    );
    await waitFor(() => expect(screen.queryByText('Vidéo 2')).toBeNull());
  });
  it('édition préremplie : durée en mm:ss, chapitres et ressources éditables', async () => {
    const { services } = await open();
    fireEvent.click(screen.getByRole('button', { name: 'Modifier Vidéo 1' }));
    expect(screen.getByLabelText(/Durée/)).toHaveValue('25:00');
    expect(screen.getByLabelText('Temps du chapitre 2')).toHaveValue('5:00');
    expect(screen.getByLabelText('Libellé de la ressource 1')).toHaveValue('Dépôt');
    fireEvent.change(screen.getByLabelText('Libellé du chapitre 2'), {
      target: { value: 'Suite modifiée' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retirer la ressource 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.videoAdminService.updateVideo).toHaveBeenCalled()
    );
    const [id, dto] = services.videoAdminService.updateVideo.mock.calls[0];
    expect(id).toBe('v1');
    expect(dto).toMatchObject({
      durationSeconds: 1500,
      chapters: [
        { t: 0, label: 'Intro' },
        { t: 300, label: 'Suite modifiée' },
      ],
      resources: [],
      videoKey: 'videos/react-avance/01-video-1.mp4',
    });
  });
  it('ajout par clé S3 saisie à la main (niveau 2) avec chapitres', async () => {
    const { services } = await open();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'Nouvelle' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'nouvelle' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/clé S3 de la vidéo/), {
      target: { value: 'videos/react-avance/04-nouvelle.mp4' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ Chapitre' }));
    fireEvent.change(screen.getByLabelText('Temps du chapitre 1'), {
      target: { value: '0:00' },
    });
    fireEvent.change(screen.getByLabelText('Libellé du chapitre 1'), {
      target: { value: 'Début' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.videoAdminService.createVideo).toHaveBeenCalled()
    );
    expect(services.videoAdminService.createVideo.mock.calls[0][0]).toMatchObject({
      seriesId: 's1',
      slug: 'nouvelle',
      durationSeconds: 600,
      chapters: [{ t: 0, label: 'Début' }],
      status: 'draft',
    });
    expect(services.videoAdminService.uploadFile).not.toHaveBeenCalled();
  });
  it.each([
    [
      'durée invalide',
      () => fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '1h' } }),
      /Durée invalide/,
    ],
    [
      'aucun fichier ni clé',
      () =>
        fireEvent.change(screen.getByLabelText(/clé S3 de la vidéo/), {
          target: { value: '' },
        }),
      /fichier vidéo/,
    ],
  ])('validation : %s', async (_n, act, msg) => {
    const { services } = await open();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'n' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/clé S3 de la vidéo/), {
      target: { value: 'videos/react-avance/01-n.mp4' },
    });
    act();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText(msg)).toBeInTheDocument();
    expect(services.videoAdminService.createVideo).not.toHaveBeenCalled();
  });
  it('envoi direct vers S3 : barre de progression, puis création avec la clé générée par le serveur', async () => {
    let finish;
    const uploadFile = vi.fn((_arg, opts) => {
      opts.onProgress(40);
      return new Promise(
        (r) => (finish = () => r('videos/react-avance/04-nouvelle.mp4'))
      );
    });
    const { services } = await open(adminServices({ uploadFile }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'Nouvelle' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'nouvelle' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    const file = new File(['x'], 'mon film.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByLabelText(/Fichier vidéo/), {
      target: { files: [file] },
    });
    expect(screen.getByLabelText(/clé S3 de la vidéo/)).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const bar = await screen.findByRole('progressbar', { name: 'Envoi du fichier' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(uploadFile.mock.calls[0][0]).toMatchObject({
      seriesId: 's1',
      videoSlug: 'nouvelle',
      kind: 'video',
      file,
    });
    finish();
    await waitFor(() =>
      expect(services.videoAdminService.createVideo).toHaveBeenCalled()
    );
    expect(services.videoAdminService.createVideo.mock.calls[0][0].videoKey).toBe(
      'videos/react-avance/04-nouvelle.mp4'
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it("« Annuler l'envoi » interrompt le transfert (AbortSignal) et rien n'est créé", async () => {
    let signal;
    const uploadFile = vi.fn((_arg, opts) => {
      signal = opts.signal;
      opts.onProgress(10);
      return new Promise((_r, rej) =>
        signal.addEventListener('abort', () => rej(new Error('Envoi annulé')))
      );
    });
    const { services } = await open(adminServices({ uploadFile }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'n' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/Fichier vidéo/), {
      target: { files: [new File(['x'], 'a.mp4', { type: 'video/mp4' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    fireEvent.click(await screen.findByRole('button', { name: /Annuler l’envoi/ }));
    expect(signal.aborted).toBe(true);
    expect(await screen.findByText('Envoi annulé')).toBeInTheDocument();
    expect(services.videoAdminService.createVideo).not.toHaveBeenCalled();
    expect(screen.queryByRole('progressbar', { name: 'Envoi du fichier' })).toBeNull();
  });
  it("fermer le formulaire pendant un envoi l'interrompt aussi", async () => {
    let signal;
    const uploadFile = vi.fn((_a, opts) => {
      signal = opts.signal;
      return new Promise(() => {});
    });
    await open(adminServices({ uploadFile }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'n' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/Fichier vidéo/), {
      target: { files: [new File(['x'], 'a.mp4', { type: 'video/mp4' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(signal).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(signal.aborted).toBe(true);
  });
  it('quitter la page abandonne un envoi en cours', async () => {
    let signal;
    const uploadFile = vi.fn((_a, opts) => {
      signal = opts.signal;
      return new Promise(() => {});
    });
    const { unmount } = await open(adminServices({ uploadFile }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter une vidéo/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'N' } });
    fireEvent.change(screen.getByLabelText(/^Slug/), { target: { value: 'n' } });
    fireEvent.change(screen.getByLabelText(/Durée/), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/Fichier vidéo/), {
      target: { files: [new File(['x'], 'a.mp4', { type: 'video/mp4' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(signal).toBeDefined());
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it("série introuvable : message d'erreur et lien de retour", async () => {
    renderApp(
      '/admin/formations/zzz',
      adminServices({
        getSeries: vi.fn().mockRejectedValue(new Error('Série introuvable')),
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Série introuvable');
  });
});
