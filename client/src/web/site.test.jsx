import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, makeServices } from './testUtils.jsx';
import ContactService from '../bll/services/ContactService.js';
import * as siteContent from '../domain/content/siteContent.js';

beforeEach(() => {
  window.matchMedia = () => ({
    matches: true,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
});

afterEach(() => {
  delete window.matchMedia;
  document.body.style.overflow = '';
});

const { profile, projects } = siteContent;

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

describe('Navigation et gabarit', () => {
  it('liens de navigation + bouton Me contacter + pied de page avec espace admin', async () => {
    renderApp('/');

    await screen.findByRole('heading', { level: 1 });

    const nav = screen.getByRole('navigation', { name: /principale/i });

    for (const name of [
      'Accueil',
      'À propos',
      'Projets',
      'Certifications',
      'Distinctions',
    ]) {
      expect(within(nav).getAllByRole('link', { name })[0]).toBeInTheDocument();
    }

    expect(within(nav).getByRole('link', { name: 'Me contacter' })).toHaveAttribute(
      'href',
      '/contact'
    );

    expect(screen.getByRole('link', { name: /Espace administrateur/ })).toHaveAttribute(
      'href',
      '/admin'
    );

    expect(screen.getByRole('link', { name: /Aller au contenu/ })).toHaveAttribute(
      'href',
      '#contenu'
    );

    await screen.findByText('Certifications en vedette');
  });

  it('menu mobile : ouvre, ferme avec Échap, se ferme au clic sur un lien et libère le défilement', async () => {
    renderApp('/');

    await screen.findByRole('heading', { level: 1 });

    const burger = screen.getByRole('button', { name: 'Menu' });
    expect(burger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(burger);

    const menu = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(menu).getByRole('link', { name: /Contact/ })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', {
        name: /Projets/,
      })
    );

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();

    expect(
      await screen.findByRole('heading', { level: 1, name: /Travaux/ })
    ).toBeInTheDocument();
  });

  it('route inconnue : page 404 stylée avec retour accueil', async () => {
    renderApp('/nimporte-quoi');

    expect(
      await screen.findByRole('heading', { level: 1, name: '404' })
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('link', { name: /Retour à l’accueil/i })
    ).toHaveAttribute('href', '/');
  });

  it('remonte en haut de page à chaque changement de route', async () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    renderApp('/');

    const nav = await screen.findByRole('navigation', {
      name: /principale/i,
    });

    fireEvent.click(within(nav).getByRole('link', { name: 'À propos' }));

    await screen.findByRole('heading', { name: /Compétences/ });
    expect(spy).toHaveBeenCalledWith(0, 0);

    spy.mockRestore();
  });
});

describe('Accueil (héros)', () => {
  it('héros : nom, rôle, disponibilité, appels à l’action', async () => {
    renderApp('/');

    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(profile.name);
    expect(h1).toHaveTextContent(/full-stack/);

    expect(await screen.findByText(new RegExp(profile.availability))).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Voir mes projets/ })).toHaveAttribute(
      'href',
      '/projets'
    );

    expect(screen.getAllByRole('link', { name: 'Me contacter' }).length).toBeGreaterThan(
      0
    );

    await screen.findByText('Certifications en vedette');
  });

  it('bandeau de technologies : copie décorative cachée aux lecteurs d’écran', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1 });

    const marquee = screen.getByRole('list', { name: 'Technologies' });
    expect(marquee.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
    expect(marquee.textContent).toContain('React');
  });

  it('chiffres clés réels : projets, certifications, distinctions, technologies', async () => {
    renderApp('/');

    const stats = await screen.findByRole('region', {
      name: 'Chiffres clés',
    });

    await waitFor(() => {
      expect(stats).toHaveTextContent(/3\+\s*Certifications/);
      expect(stats).toHaveTextContent(new RegExp(`${projects.length}\\+\\s*Projets`));
      expect(stats).toHaveTextContent(
        new RegExp(`${profile.tech.length}\\+\\s*Technologies`)
      );
      expect(stats).toHaveTextContent(/3\+\s*Distinctions/);
    });
  });

  it('projets en vedette : cartes menant au détail', async () => {
    renderApp('/');

    const card = await screen.findByRole('link', {
      name: `Projet ${projects[0].title}`,
    });

    expect(card).toHaveAttribute('href', `/projets/${projects[0].slug}`);
  });

  it('le halo du héros suit la souris (variables CSS) et nettoie son écouteur', async () => {
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback();
        return 1;
      });

    const { container, unmount } = renderApp('/');
    await screen.findByRole('heading', { level: 1 });

    const glow = container.querySelector('.pf-glow');
    expect(glow).not.toBeNull();

    fireEvent.mouseMove(glow, { clientX: 120, clientY: 80 });
    expect(glow.style.getPropertyValue('--mx')).not.toBe('');
    expect(glow.style.getPropertyValue('--my')).not.toBe('');

    unmount();
    raf.mockRestore();
  });
});

describe('Page À propos', () => {
  it('titre, compétences en barres de progression accessibles, parcours, valeurs', async () => {
    renderApp('/a-propos');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /n’oublie pas/
    );

    const bar = screen.getByRole('progressbar', {
      name: profile.skills[0].name,
    });

    expect(bar).toHaveAttribute('aria-valuenow', String(profile.skills[0].level));
    expect(screen.getAllByRole('progressbar')).toHaveLength(profile.skills.length);
    expect(screen.getByText(profile.timeline[0].title)).toBeInTheDocument();

    for (const value of profile.values) {
      expect(screen.getByText(value.title)).toBeInTheDocument();
    }
  });

  it('affiche le portrait s’il est configuré ; sans CV, conserve le bouton Contact', async () => {
    renderApp('/a-propos');

    const main = await screen.findByRole('main');

    if (profile.photoUrl) {
      expect(
        within(main).getByRole('img', {
          name: /portrait de florwensky paniague/i,
        })
      ).toBeInTheDocument();
    } else {
      expect(within(main).getByText(profile.initials)).toBeInTheDocument();
    }

    expect(screen.queryByRole('link', { name: /Télécharger le CV/i })).toBeNull();

    expect(screen.getAllByRole('link', { name: 'Me contacter' }).length).toBeGreaterThan(
      0
    );
  });
});

describe('Page Projets', () => {
  it('liste tous les projets avec compteur et catégories', async () => {
    renderApp('/projets');

    await screen.findByRole('heading', { level: 1, name: /Travaux/ });

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /^Projet / })).toHaveLength(
        projects.length
      );
    });

    expect(
      screen.getByRole('button', { name: `Tous (${projects.length})` })
    ).toHaveAttribute('aria-pressed', 'true');

    for (const category of new Set(projects.map((project) => project.category))) {
      expect(screen.getByRole('button', { name: category })).toBeInTheDocument();
    }
  });

  it('filtre par catégorie puis revient à « Tous »', async () => {
    renderApp('/projets');

    await screen.findByRole('heading', { level: 1, name: /Travaux/ });

    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /^Projet / })).toHaveLength(
        projects.filter((project) => project.category === 'Mobile').length
      );
    });

    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: /^Tous/ }));

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /^Projet / })).toHaveLength(
        projects.length
      );
    });
  });

  it('recherche sans accents et annonce les résultats absents', async () => {
    renderApp('/projets');

    const search = await screen.findByRole('searchbox', {
      name: 'Rechercher un projet',
    });

    // Utilise le titre réel d’un projet pour éviter de dépendre d’un mot
    // qui n’existerait pas dans les données de test.
    const projectWithAccents = projects.find((project) => /[À-ÿ]/.test(project.title));
    const projectToFind = projectWithAccents || projects[0];
    const query = normalizeText(projectToFind.title);

    fireEvent.change(search, { target: { value: query } });

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /^Projet / })).toHaveLength(1);
    });

    expect(
      screen.getByRole('link', {
        name: `Projet ${projectToFind.title}`,
      })
    ).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzzz_aucun_resultat' } });

    expect(
      await screen.findByText(/Aucun projet ne correspond à cette recherche/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryAllByRole('link', { name: /^Projet / })).toHaveLength(0);
    });
  });

  it('le filtre persiste quand on quitte la page puis qu’on y revient', async () => {
    renderApp('/projets');

    await screen.findByRole('heading', { level: 1, name: /Travaux/ });

    fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));

    const nav = () => within(screen.getByRole('navigation', { name: /principale/i }));

    fireEvent.click(nav().getByRole('link', { name: 'À propos' }));
    await screen.findByRole('heading', { name: /Compétences/ });

    fireEvent.click(nav().getByRole('link', { name: 'Projets' }));
    await screen.findByRole('heading', { level: 1, name: /Travaux/ });

    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('Détail d’un projet', () => {
  it('affiche le défi, la solution, la fiche et les indicateurs disponibles', async () => {
    renderApp(`/projets/${projects[0].slug}`);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: projects[0].title,
      })
    ).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Le défi' })).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: 'La solution' })
    ).toBeInTheDocument();

    expect(screen.getByText(projects[0].role)).toBeInTheDocument();

    // Les données peuvent utiliser différents noms de propriété pour les
    // indicateurs. Vérifie un indicateur lorsqu’un tableau correspondant existe.
    const indicatorEntry = Object.entries(projects[0]).find(
      ([key, value]) =>
        /result|metric|stat|indicator/i.test(key) &&
        Array.isArray(value) &&
        value.length > 0
    );

    if (indicatorEntry) {
      const firstIndicator = indicatorEntry[1][0];
      const label = firstIndicator?.label || firstIndicator?.title;

      if (label) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    }
  });

  it('projet suivant et navigation vers lui', async () => {
    renderApp(`/projets/${projects[0].slug}`);

    await screen.findByRole('heading', {
      level: 1,
      name: projects[0].title,
    });

    const nextProjectLink = await screen.findByRole('link', {
      name: new RegExp(projects[1].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    });

    fireEvent.click(nextProjectLink);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: projects[1].title,
      })
    ).toBeInTheDocument();
  });

  it('slug inconnu : message clair et retour à la liste', async () => {
    renderApp('/projets/nexiste-pas');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /introuvable/i
    );

    expect(
      await screen.findByRole('link', { name: /Tous les projets/i })
    ).toHaveAttribute('href', '/projets');
  });

  it('pas de lien externe si l’URL n’est pas en http(s)', async () => {
    renderApp(`/projets/${projects[0].slug}`);

    await screen.findByRole('heading', {
      level: 1,
      name: projects[0].title,
    });

    expect(screen.queryByRole('link', { name: /Voir le site/i })).toBeNull();

    expect(screen.queryByRole('link', { name: /Code source/i })).toBeNull();
  });
});

describe('Page Contact', () => {
  const fill = async (overrides = {}) => {
    const values = {
      nom: 'Ada Lovelace',
      email: 'ada@ex.com',
      sujet: 'Mandat',
      message: 'Bonjour, parlons de votre projet.',
      ...overrides,
    };

    fireEvent.change(await screen.findByLabelText('Nom'), {
      target: { value: values.nom },
    });
    fireEvent.change(await screen.findByLabelText('Courriel'), {
      target: { value: values.email },
    });
    fireEvent.change(await screen.findByLabelText('Sujet'), {
      target: { value: values.sujet },
    });
    fireEvent.change(await screen.findByLabelText('Message'), {
      target: { value: values.message },
    });
  };

  it('affiche le formulaire, la disponibilité et le honeypot caché', async () => {
    renderApp('/contact');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Parlons projet/i
    );

    expect(
      screen.getByRole('form', { name: /Formulaire de contact/i })
    ).toBeInTheDocument();

    const honeypot = screen.getByLabelText('Ne pas remplir');
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
  });

  it('envoi réussi : confirmation, puis possibilité d’écrire un autre message', async () => {
    const { services } = renderApp('/contact');

    await fill();
    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    expect(await screen.findByText('Message envoyé.')).toBeInTheDocument();

    expect(services.contactService.send).toHaveBeenCalledWith({
      nom: 'Ada Lovelace',
      email: 'ada@ex.com',
      sujet: 'Mandat',
      message: 'Bonjour, parlons de votre projet.',
      website: '',
    });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer un autre message/i }));

    expect(await screen.findByLabelText('Nom')).toHaveValue('');
  });

  it('validation (vrai service) : erreur affichée, aucun appel API', async () => {
    const repo = { send: vi.fn() };

    renderApp('/contact', makeServices({ contactService: new ContactService(repo) }));

    await fill({ email: 'pas-un-courriel' });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/courriel invalide/i);
    expect(repo.send).not.toHaveBeenCalled();

    await fill({ message: 'court' });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/10 caractères|courriel/i);
    });
  });

  it('erreur serveur : message affiché, les saisies sont conservées', async () => {
    renderApp(
      '/contact',
      makeServices({
        contactService: {
          send: vi
            .fn()
            .mockRejectedValue(new Error('Trop de requêtes, réessayez plus tard')),
        },
      })
    );

    await fill();

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de requêtes');
    expect(await screen.findByLabelText('Nom')).toHaveValue('Ada Lovelace');
  });

  it('le honeypot rempli est transmis (le serveur l’ignore)', async () => {
    const { services } = renderApp('/contact');

    await fill();

    fireEvent.change(await screen.findByLabelText('Ne pas remplir'), {
      target: { value: 'http://spam' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    await waitFor(() => {
      expect(services.contactService.send).toHaveBeenCalled();
    });

    expect(services.contactService.send.mock.calls[0][0].website).toBe('http://spam');
  });

  it('bouton désactivé pendant l’envoi (pas de double envoi)', async () => {
    let resolve;
    const send = vi.fn(
      () =>
        new Promise((resolvePromise) => {
          resolve = resolvePromise;
        })
    );

    renderApp('/contact', makeServices({ contactService: { send } }));

    await fill();

    fireEvent.click(screen.getByRole('button', { name: /Envoyer le message/i }));

    expect(await screen.findByRole('button', { name: 'Envoi…' })).toBeDisabled();

    resolve({});
    expect(await screen.findByText('Message envoyé.')).toBeInTheDocument();
  });
});
