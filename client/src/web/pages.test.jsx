import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, makeServices, CERTS, AWARDS } from './testUtils.jsx';
import NewsletterService from '../bll/services/NewsletterService.js';

vi.mock('./utils/download.js', () => ({ downloadTextFile: vi.fn() }));
import { downloadTextFile } from './utils/download.js';

beforeEach(() => {
  // Animations désactivées : les compteurs affichent directement leur valeur.
  window.matchMedia = () => ({ matches: true });
  vi.clearAllMocks();
});
afterEach(() => {
  delete window.matchMedia;
});

describe('Navbar et routes', () => {
  it('deux nouveaux NavLink : Certifications et Distinctions, avec lien actif', async () => {
    renderApp('/certifications');
    const nav = screen.getByRole('navigation', { name: /principale/i });
    expect(within(nav).getByRole('link', { name: 'Certifications' })).toHaveClass(
      'active'
    );
    expect(within(nav).getByRole('link', { name: 'Distinctions' })).not.toHaveClass(
      'active'
    );
    expect(within(nav).getByRole('link', { name: 'Distinctions' })).toHaveAttribute(
      'href',
      '/distinctions'
    );
    await screen.findByText('AWS Cloud Practitioner');
  });
  it('/distinctions et /certifications existent ; route inconnue → 404', async () => {
    renderApp('/distinctions');
    expect(
      await screen.findByRole('heading', { name: /Bourses et mérites/ })
    ).toBeInTheDocument();
  });
});

describe('Page /certifications', () => {
  it('charge et affiche la grille avec badges Valide / Expirée / Sans expiration', async () => {
    renderApp('/certifications');
    expect(screen.getByRole('status')).toHaveTextContent('Chargement'); // withLoader
    expect(await screen.findByText('AWS Cloud Practitioner')).toBeInTheDocument();
    expect(screen.getByText('Valide')).toBeInTheDocument();
    expect(screen.getByText('Expirée')).toBeInTheDocument();
    expect(screen.getByText('Sans expiration')).toBeInTheDocument();
    expect(screen.getByTestId('cert-total')).toHaveTextContent('3');
  });
  it("erreur réseau : message d'erreur (withLoader)", async () => {
    renderApp(
      '/certifications',
      makeServices({
        certificationService: {
          list: vi.fn().mockRejectedValue(new Error('API indisponible')),
        },
      })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('API indisponible');
  });
  it('recherche texte, y compris sans accents et par compétence', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    fireEvent.change(screen.getByLabelText('Recherche'), {
      target: { value: 'cybersecurite' },
    });
    expect(screen.getByText('Cybersécurité Cisco')).toBeInTheDocument();
    expect(screen.queryByText('Scrum Master')).toBeNull();
    fireEvent.change(screen.getByLabelText('Recherche'), { target: { value: 'ec2' } });
    expect(screen.getByText('AWS Cloud Practitioner')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '' })).toBeDefined();
  });
  it('filtres par émetteur et catégorie, puis réinitialisation', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    fireEvent.change(screen.getByLabelText('Émetteur'), { target: { value: 'Cisco' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'Cloud' } });
    expect(screen.getByText(/Aucune certification ne correspond/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Réinitialiser/ }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it('les listes de filtres proposent les valeurs existantes', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    const issuers = within(screen.getByLabelText('Émetteur'))
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(issuers).toEqual(['Tous', 'Amazon', 'Cisco', 'Scrum.org']);
  });
  it("tri par date : plus anciennes d'abord", async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    const titles = () =>
      screen
        .getAllByRole('article')
        .map((a) => within(a).getAllByRole('heading')[0].textContent);
    expect(titles()).toEqual([
      'AWS Cloud Practitioner',
      'Cybersécurité Cisco',
      'Scrum Master',
    ]);
    fireEvent.change(screen.getByLabelText('Tri'), { target: { value: 'date_asc' } });
    expect(titles()).toEqual([
      'Scrum Master',
      'Cybersécurité Cisco',
      'AWS Cloud Practitioner',
    ]);
  });
  it('bascule grille ↔ carrousel', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    fireEvent.click(screen.getByRole('button', { name: /Carrousel/ }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Grille/ }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
  it('le filtre fait revenir le carrousel à la première carte', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    fireEvent.click(screen.getByRole('button', { name: /Carrousel/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }));
    fireEvent.change(screen.getByLabelText('Tri'), { target: { value: 'date_asc' } });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
  it('modal de détail (Portal) : contenu, Échap pour fermer', async () => {
    renderApp('/certifications');
    await screen.findByText('AWS Cloud Practitioner');
    fireEvent.click(screen.getAllByRole('button', { name: /détail/i })[0]);
    const dialog = screen.getByRole('dialog', { name: 'AWS Cloud Practitioner' });
    expect(within(dialog).getByText('AWS-123')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /Vérifier/ })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Page /distinctions', () => {
  it("frise groupée par année, plus récente d'abord", async () => {
    renderApp('/distinctions');
    await screen.findByText('Bourse Excellence');
    const years = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(years).toEqual(['2024', '2022']);
  });
  it('totaux : nombre de distinctions et montant cumulé de bourses', async () => {
    renderApp('/distinctions');
    await screen.findByText('Bourse Excellence');
    expect(screen.getByTestId('award-count')).toHaveTextContent('3');
    expect(screen.getByTestId('award-amounts').textContent.replace(/\s/g, ' ')).toMatch(
      /2 500,00\s?\$/
    );
  });
  it("onglets par type : le total suit l'onglet", async () => {
    renderApp('/distinctions');
    await screen.findByText('Bourse Excellence');
    fireEvent.click(screen.getByRole('tab', { name: 'Mérite' }));
    expect(screen.getByText('Mérite scolaire')).toBeInTheDocument();
    expect(screen.queryByText('Bourse Excellence')).toBeNull();
    expect(screen.getByTestId('award-count')).toHaveTextContent('1');
    expect(screen.getByText('Aucun montant')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Honneur' }));
    expect(
      screen.getByText(/Aucune distinction dans cette catégorie/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Toutes' }));
    expect(screen.getByRole('tab', { name: 'Toutes' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
  it('modal de détail avec justificatif public', async () => {
    renderApp('/distinctions');
    await screen.findByText('Bourse Excellence');
    fireEvent.click(screen.getAllByRole('button', { name: /détail/i })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Bourse Excellence' });
    expect(within(dialog).getByText('Fondation X')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /justificatif/i })).toHaveAttribute(
      'href',
      'https://cdn.example/just.pdf'
    );
  });
});

describe('Accueil', () => {
  it('certifications : les 3 dernières, puis les vedettes restantes, sans doublon', async () => {
    const services = makeServices();
    const recent = ['Kubernetes', 'Terraform', 'Docker'].map((title, i) => ({
      ...CERTS[1],
      id: `n${i}`,
      title,
      createdAt: `2026-10-0${i + 1}T00:00:00Z`,
    }));
    services.certificationService.list.mockResolvedValue([...CERTS, ...recent]);
    renderApp('/', services);
    const latest = await screen.findByRole('heading', {
      name: 'Dernières certifications',
    });
    const latestSection = within(latest.closest('section'));
    expect(await latestSection.findByText('Docker')).toBeInTheDocument();
    expect(latestSection.queryByText('AWS Cloud Practitioner')).toBeNull();
    const featured = await screen.findByRole('heading', {
      name: 'Certifications en vedette',
    });
    const featuredSection = within(featured.closest('section'));
    expect(featuredSection.getByText('AWS Cloud Practitioner')).toBeInTheDocument();
    expect(featuredSection.queryByText('Docker')).toBeNull();
    expect(featuredSection.queryByText('Scrum Master')).toBeNull();
  });
  it('une seule section de projets ; articles et certifications récents affichés', async () => {
    const { services } = renderApp('/');
    const articles = await screen.findByRole('heading', { name: 'Derniers articles' });
    expect(services.articleService.list).toHaveBeenCalledWith({ limit: 3 });
    expect(
      within(articles.closest('section')).getByText('Redux sans hooks')
    ).toBeInTheDocument();
    const certs = await screen.findByRole('heading', {
      name: 'Dernières certifications',
    });
    expect(
      await within(certs.closest('section')).findByText('Scrum Master')
    ).toBeInTheDocument();
    const awards = await screen.findByRole('heading', { name: 'Bourses et mérites' });
    expect(awards).toHaveClass('pf-h2');
    expect(screen.queryByRole('heading', { name: 'Dernières distinctions' })).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Projets en vedette' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Sorti de l’atelier')).toBeNull();
  });
  it('aucun article : la section reste visible avec un message', async () => {
    const services = makeServices();
    services.articleService.list = vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pages: 1, categories: [] });
    renderApp('/', services);
    expect(
      await screen.findByText('Aucun article publié pour l’instant.')
    ).toBeInTheDocument();
  });
  it('création depuis l’admin : la case « Notifier les abonnés » est transmise', async () => {
    const services = makeServices();
    services.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
    renderApp('/admin/certifications', services);
    await screen.findByText('Scrum Master');
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: 'Ancienne' } });
    fireEvent.change(screen.getByLabelText('Émetteur *'), { target: { value: 'Org' } });
    fireEvent.change(screen.getByLabelText("Date d'obtention *"), {
      target: { value: '2020-01-01' },
    });
    const notify = screen.getByLabelText(/Notifier les abonnés/);
    expect(notify).toBeChecked();
    fireEvent.click(notify);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.certificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Ancienne', notify: false })
      )
    );
  });
  it('résumé des distinctions (via DataFetcher)', async () => {
    renderApp('/');
    expect(await screen.findByTestId('award-count')).toHaveTextContent('3');
    expect(screen.getByRole('link', { name: /Voir la frise/ })).toHaveAttribute(
      'href',
      '/distinctions'
    );
  });
  it("si les distinctions échouent, le reste de l'accueil reste affiché", async () => {
    renderApp(
      '/',
      makeServices({
        awardService: {
          list: vi.fn().mockRejectedValue(new Error('Panne distinctions')),
        },
      })
    );
    expect(await screen.findByText('Panne distinctions')).toBeInTheDocument();
    expect(await screen.findByText('AWS Cloud Practitioner')).toBeInTheDocument();
  });
  it("newsletter : consentement obligatoire, message d'erreur, aucun appel API", async () => {
    // Vrai service BLL (la validation y vit) avec un faux repository
    const repo = { subscribe: vi.fn() };
    const { services } = renderApp(
      '/',
      makeServices({ newsletterService: new NewsletterService(repo) })
    );
    fireEvent.change(await screen.findByLabelText('Adresse courriel'), {
      target: { value: 'ada@ex.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: "S'abonner" }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/accepter/i);
    expect(repo.subscribe).not.toHaveBeenCalled();
    expect(services).toBeDefined();
  });
  it('newsletter : inscription → message de double confirmation', async () => {
    const { services } = renderApp('/');
    fireEvent.change(await screen.findByLabelText('Adresse courriel'), {
      target: { value: 'ada@ex.com' },
    });
    fireEvent.click(screen.getByLabelText(/J'accepte de recevoir/));
    fireEvent.click(screen.getByRole('button', { name: "S'abonner" }));
    expect(await screen.findByText(/courriel de confirmation/)).toBeInTheDocument();
    expect(services.newsletterService.subscribe).toHaveBeenCalledWith({
      email: 'ada@ex.com',
      consent: true,
      website: '',
    });
  });
  it('newsletter : le texte de consentement mentionne la désinscription', async () => {
    renderApp('/');
    expect(await screen.findByLabelText(/désabonner à tout moment/)).toBeInTheDocument();
  });
  it("newsletter : le honeypot rempli est transmis (le serveur l'ignore)", async () => {
    const { services } = renderApp('/');
    fireEvent.change(await screen.findByLabelText('Adresse courriel'), {
      target: { value: 'bot@ex.com' },
    });
    fireEvent.change(screen.getByLabelText('Ne pas remplir'), {
      target: { value: 'http://spam' },
    });
    fireEvent.click(screen.getByLabelText(/J'accepte de recevoir/));
    fireEvent.click(screen.getByRole('button', { name: "S'abonner" }));
    await waitFor(() => expect(services.newsletterService.subscribe).toHaveBeenCalled());
    expect(services.newsletterService.subscribe.mock.calls[0][0].website).toBe(
      'http://spam'
    );
  });
  it("le champ honeypot est caché aux humains et aux lecteurs d'écran", async () => {
    renderApp('/');
    const field = await screen.findByLabelText('Ne pas remplir');
    expect(field.closest('[aria-hidden=true]')).not.toBeNull();
    expect(field).toHaveAttribute('tabindex', '-1');
  });
  it('notifications push : activation', async () => {
    const { services } = renderApp('/');
    fireEvent.click(
      await screen.findByRole('button', { name: /Activer les notifications/ })
    );
    expect(await screen.findByText('Notifications activées.')).toBeInTheDocument();
    expect(services.pushService.enable).toHaveBeenCalled();
  });
  it('notifications push : permission refusée → message', async () => {
    renderApp(
      '/',
      makeServices({ pushService: { enable: vi.fn().mockResolvedValue('unavailable') } })
    );
    fireEvent.click(
      await screen.findByRole('button', { name: /Activer les notifications/ })
    );
    expect(await screen.findByText(/indisponibles/)).toBeInTheDocument();
  });
});

describe('Admin : accès', () => {
  it('sans session : redirection vers la connexion', async () => {
    renderApp('/admin/certifications');
    expect(
      await screen.findByRole('heading', { name: /Connexion administrateur/ })
    ).toBeInTheDocument();
  });
  it('connexion réussie → tableau de bord, puis certifications', async () => {
    const { services } = renderApp('/admin');
    fireEvent.change(await screen.findByLabelText('Courriel'), {
      target: { value: 'admin@ex.com' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(
      await screen.findByRole('heading', { name: 'Tableau de bord' })
    ).toBeInTheDocument();
    expect(services.authClient.signIn).toHaveBeenCalledWith('admin@ex.com', 'secret');
    fireEvent.click(screen.getByRole('link', { name: 'Certifications' }));
    expect(
      await screen.findByRole('heading', { name: 'Certifications' })
    ).toBeInTheDocument();
    expect(await screen.findByText('Scrum Master')).toBeInTheDocument();
  });
  it('échec de connexion : message vague, reste sur la page', async () => {
    renderApp(
      '/admin',
      makeServices({
        authClient: {
          getSession: vi.fn().mockResolvedValue(null),
          signIn: vi.fn().mockRejectedValue(new Error('user not found')),
        },
      })
    );
    fireEvent.change(await screen.findByLabelText('Courriel'), {
      target: { value: 'x@y.z' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants invalides.');
  });
  it('déconnexion → retour à la connexion', async () => {
    const services = makeServices();
    services.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
    renderApp('/admin/certifications', services);
    fireEvent.click(await screen.findByRole('button', { name: 'Déconnexion' }));
    expect(
      await screen.findByRole('heading', { name: /Connexion administrateur/ })
    ).toBeInTheDocument();
  });
});

describe('Admin : CRUD certifications', () => {
  const logged = () => {
    const s = makeServices();
    s.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
    return s;
  };

  it('tableau : recherche, tri, export CSV', async () => {
    renderApp('/admin/certifications', logged());
    await screen.findByText('Scrum Master');
    fireEvent.change(screen.getByLabelText('Rechercher dans le tableau'), {
      target: { value: 'cisco' },
    });
    expect(screen.queryByText('Scrum Master')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Exporter CSV/ }));
    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [name, csv] = downloadTextFile.mock.calls[0];
    expect(name).toBe('certifications.csv');
    expect(csv).toContain('Cybersécurité Cisco');
    expect(csv).not.toContain('Scrum Master');
    expect(csv.split('\r\n')[0]).toContain('Titre');
  });
  it("création : validation, envoi du PDF et de l'image (buckets), dto correct", async () => {
    const services = logged();
    renderApp('/admin/certifications', services);
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Le titre est obligatoire.')).toBeInTheDocument();
    expect(services.certificationService.create).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'Azure Fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/^Émetteur/), {
      target: { value: 'Microsoft' },
    });
    fireEvent.change(screen.getByLabelText(/Date d'obtention/), {
      target: { value: '2025-02-02' },
    });
    fireEvent.change(screen.getByLabelText(/Compétences/), {
      target: { value: 'Azure, Cloud' },
    });
    fireEvent.click(screen.getByLabelText('En vedette'));
    const img = new File(['x'], 'badge.png', { type: 'image/png' });
    const pdf = new File(['x'], 'att.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText(/Image du badge/), {
      target: { files: [img] },
    });
    fireEvent.change(screen.getByLabelText(/Document \(PDF\)/), {
      target: { files: [pdf] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(services.certificationService.create).toHaveBeenCalled());
    expect(services.uploadService.upload).toHaveBeenCalledWith(
      img,
      'image',
      'certifications'
    );
    expect(services.uploadService.upload).toHaveBeenCalledWith(
      pdf,
      'document',
      'certifications'
    );
    expect(services.certificationService.create.mock.calls[0][0]).toMatchObject({
      title: 'Azure Fundamentals',
      issuer: 'Microsoft',
      issueDate: '2025-02-02',
      skills: ['Azure', 'Cloud'],
      featured: true,
      imageUrl: 'https://cdn.example/uploaded.png',
      documentUrl: 'https://cdn.example/uploaded.png',
      expiryDate: null,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByText('Azure Fundamentals')).toBeInTheDocument();
  });
  it('création : erreur du serveur affichée dans le formulaire', async () => {
    const services = logged();
    services.certificationService.create.mockRejectedValue(
      new Error('Données invalides')
    );
    renderApp('/admin/certifications', services);
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/^Émetteur/), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText(/Date d'obtention/), {
      target: { value: '2025-02-02' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Données invalides')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('édition : formulaire prérempli, mise à jour par id', async () => {
    const services = logged();
    renderApp('/admin/certifications', services);
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier Scrum Master' }));
    expect(screen.getByLabelText(/^Titre/)).toHaveValue('Scrum Master');
    expect(screen.getByLabelText(/Date d'expiration/)).toHaveValue('2023-06-01');
    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'Scrum Master PSM I' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(services.certificationService.update).toHaveBeenCalled());
    expect(services.certificationService.update.mock.calls[0][0]).toBe('c2');
    expect(await screen.findByText('Scrum Master PSM I')).toBeInTheDocument();
  });
  it('suppression : confirmation obligatoire (modal Portal), annulation possible', async () => {
    const services = logged();
    renderApp('/admin/certifications', services);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Scrum Master' })
    );
    expect(
      screen.getByRole('dialog', { name: /Confirmer la suppression/ })
    ).toHaveTextContent('Scrum Master');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(services.certificationService.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Scrum Master' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.certificationService.remove).toHaveBeenCalledWith('c2')
    );
    await waitFor(() => expect(screen.queryByText('Scrum Master')).toBeNull());
  });
});

describe('Admin : distinctions', () => {
  const logged = () => {
    const s = makeServices();
    s.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
    return s;
  };
  it("liste, création d'une bourse avec montant, puis rechargement", async () => {
    const services = logged();
    renderApp('/admin/awards', services);
    expect(await screen.findByText('Bourse Excellence')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), {
      target: { value: 'Bourse Hydro' },
    });
    fireEvent.change(screen.getByLabelText(/^Organisme/), { target: { value: 'Hydro' } });
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'scholarship' } });
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: '2025-09-09' } });
    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '3000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(services.awardService.create).toHaveBeenCalled());
    expect(services.awardService.create.mock.calls[0][0]).toMatchObject({
      title: 'Bourse Hydro',
      type: 'scholarship',
      amount: 3000,
      currency: 'CAD',
      awardedAt: '2025-09-09',
    });
    await waitFor(() => expect(services.awardService.list).toHaveBeenCalledTimes(2));
  });
  it('validation : montant négatif refusé', async () => {
    renderApp('/admin/awards', logged());
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText(/^Titre/), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText(/^Organisme/), { target: { value: 'O' } });
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: '2025-09-09' } });
    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(
      await screen.findByText('Le montant doit être un nombre positif.')
    ).toBeInTheDocument();
  });
  it('suppression avec confirmation', async () => {
    const services = logged();
    renderApp('/admin/awards', services);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Supprimer Prix du jury' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() => expect(services.awardService.remove).toHaveBeenCalledWith('a2'));
  });
});

describe('Admin : abonnés', () => {
  const logged = () => {
    const s = makeServices();
    s.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
    return s;
  };
  it('deux onglets (newsletter, push) avec statut confirmé/actif', async () => {
    renderApp('/admin/subscribers', logged());
    expect(await screen.findByText('ada@ex.com')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Newsletter \(1\)/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('columnheader', { name: /Confirmé/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Push \(1\)/ }));
    expect(screen.getByText('abcdef…wxyz')).toBeInTheDocument();
    expect(screen.queryByText('ada@ex.com')).toBeNull();
  });
  it('export CSV par onglet', async () => {
    renderApp('/admin/subscribers', logged());
    await screen.findByText('ada@ex.com');
    fireEvent.click(screen.getByRole('button', { name: /Exporter CSV/ }));
    expect(downloadTextFile.mock.calls[0][0]).toBe('abonnes-newsletter.csv');
    expect(downloadTextFile.mock.calls[0][1]).toContain('ada@ex.com');
    fireEvent.click(screen.getByRole('tab', { name: /Push/ }));
    fireEvent.click(screen.getByRole('button', { name: /Exporter CSV/ }));
    expect(downloadTextFile.mock.calls[1][0]).toBe('abonnes-push.csv');
  });
  it('suppression via modal Portal : newsletter puis push', async () => {
    const services = logged();
    renderApp('/admin/subscribers', services);
    await screen.findByText('ada@ex.com');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('ada@ex.com');
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.subscriberAdminService.removeNewsletter).toHaveBeenCalledWith('n1')
    );
    fireEvent.click(screen.getByRole('tab', { name: /Push/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.subscriberAdminService.removePush).toHaveBeenCalledWith('p1')
    );
  });
  it('bouton « Envoyer un courriel de test »', async () => {
    const services = logged();
    renderApp('/admin/subscribers', services);
    fireEvent.change(await screen.findByLabelText('Adresse de test'), {
      target: { value: 'moi@ex.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer un courriel de test/ }));
    expect(await screen.findByText('Courriel de test envoyé.')).toBeInTheDocument();
    expect(services.subscriberAdminService.sendTestEmail).toHaveBeenCalledWith(
      'moi@ex.com'
    );
  });
  it('échec du courriel de test signalé', async () => {
    const services = logged();
    services.subscriberAdminService.sendTestEmail.mockRejectedValue(new Error('x'));
    renderApp('/admin/subscribers', services);
    fireEvent.change(await screen.findByLabelText('Adresse de test'), {
      target: { value: 'moi@ex.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer un courriel de test/ }));
    expect(await screen.findByText(/Échec de l'envoi/)).toBeInTheDocument();
  });
});

it("jeu de données de test cohérent avec le format de l'API", () => {
  expect(CERTS.every((c) => 'status' in c)).toBe(true);
  expect(AWARDS.items.every((a) => 'year' in a)).toBe(true);
});
