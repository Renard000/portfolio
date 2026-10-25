import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, makeServices } from './testUtils.jsx';
import ContactService from '../bll/services/ContactService.js';
import ContentService from '../bll/services/ContentService.js';
import * as siteContent from '../domain/content/siteContent.js';

beforeEach(() => {
  window.matchMedia = () => ({ matches: true });
});
afterEach(() => {
  delete window.matchMedia;
  document.body.style.overflow = '';
});
const { profile, projects } = siteContent;

describe('Navigation et gabarit', () => {
  it('liens de navigation + bouton Me contacter + pied de page avec espace admin', async () => {
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: /principale/i });

    for (const name of [
      'Accueil',
      'À propos',
      'Projets',
      'Certifications',
      'Distinctions',
    ]) {
      expect(
        await within(nav).findAllByRole('link', { name })
      ).not.toHaveLength(0);
    }

    expect(await within(nav).findByRole('link', { name: 'Me contacter' })).toHaveAttribute(
      'href',
      '/contact'
    );
    expect(await screen.findByRole('link', { name: /Espace administrateur/ })).toHaveAttribute(
      'href',
      '/admin'
    );
    expect(await screen.findByRole('link', { name: /Aller au contenu/ })).toHaveAttribute(
      'href',
      '#contenu'
    );
    await screen.findByText('Certifications en vedette');
  });

  it('menu mobile : ouvre, ferme avec Échap, se ferme au clic sur un lien et libère le défilement', async () => {
    renderApp('/');
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
    expect(await screen.findByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Retour à l’accueil/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('remonte en haut de page à chaque changement de route', async () => {
    const spy = vi.spyOn(window, 'scrollTo');
    renderApp('/');
    fireEvent.click(
      within(await screen.findByRole('navigation', { name: /principale/i })).getByRole('link', {
        name: 'À propos',
      })
    );
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
    expect(screen.getByText(new RegExp(profile.availability))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Voir mes projets/ })).toHaveAttribute(
      'href',
      '/projets'
    );
    expect(screen.getAllByRole('link', { name: 'Me contacter' }).length).toBeGreaterThan(
      0
    );
    await screen.findByText('Certifications en vedette');
  });

  it('bandeau de technologies : copie décorative cachée aux lecteurs d’écran', () => {
    renderApp('/');
    const marquee = screen.getByRole('list', { name: 'Technologies' });
    expect(marquee.querySelectorAll('[aria-hidden=true]').length).toBe(1);
    expect(marquee.textContent).toContain('React');
  });

  it('chiffres clés réels : projets, certifications, distinctions, technologies', async () => {
    renderApp('/');
    const stats = screen.getByRole('region', { name: 'Chiffres clés' });
    await waitFor(() => expect(stats).toHaveTextContent(/3\+\s*Certifications/));
    expect(stats).toHaveTextContent(new RegExp(`${projects.length}\\+\\s*Projets`));
    expect(stats).toHaveTextContent(
      new RegExp(`${profile.tech.length}\\+\\s*Technologies`)
    );
    await waitFor(() => expect(stats).toHaveTextContent(/3\+\s*Distinctions/));
  });

  it('projets en vedette : cartes menant au détail', async () => {
    renderApp('/');
    const card = screen.getByRole('link', { name: `Projet ${projects[0].title}` });
    expect(card).toHaveAttribute('href', `/projets/${projects[0].slug}`);
    await screen.findByText('Certifications en vedette');
  });

  it('le halo du héros suit la souris (variables CSS) et nettoie son écouteur', async () => {
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => (cb(), 1));
    const { container, unmount } = renderApp('/');
    const glow = container.querySelector('.pf-glow');
    fireEvent.mouseMove(glow, { clientX: 120, clientY: 80 });
    expect(glow.style.getPropertyValue('--mx')).not.toBe('');
    expect(glow.style.getPropertyValue('--my')).not.toBe('');
    unmount();
    raf.mockRestore();
  });
});

describe('Page À propos', () => {
  it('titre, compétences en barres de progression accessibles, parcours, valeurs', async() => {
    renderApp('/a-propos');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/n’oublie pas/);
    const bar = await screen.findByRole('progressbar', { name: profile.skills[0].name });
    expect(bar).toHaveAttribute('aria-valuenow', String(profile.skills[0].level));
    expect(await screen.findAllByRole('progressbar')).toHaveLength(profile.skills.length);
    expect(await screen.findByText(profile.timeline[0].title)).toBeInTheDocument();
    for (const v of profile.values) expect(screen.getByText(v.title)).toBeInTheDocument();
  });

  it('sans photo : initiales ; sans CV : seul le bouton Contact', async () => {
    const customContent = {
      ...siteContent,
      profile: { ...profile, photoUrl: '' },
    };
    renderApp(
      '/a-propos',
      makeServices({
        contentService: new ContentService(customContent),
      })
    );
    const main = await screen.findByRole('main');

    expect(
      await within(main).findByText(profile.initials)
    ).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: /Télécharger le CV/ })).toBeNull();
    const contactLinks = await screen.findAllByRole('link', { name: 'Me contacter' });
    expect(contactLinks.length).toBeGreaterThan(0);
  });
});

describe('Page Projets', () => {
  it('liste tous les projets avec compteur et catégories', async() => {
    renderApp('/projets');
    expect(await screen.findAllByRole('link', { name: /^Projet / })).toHaveLength(
      projects.length
    );
    expect(
     await screen.findByRole('button', { name: `Tous (${projects.length})` })
    ).toHaveAttribute('aria-pressed', 'true');
    for (const c of new Set(projects.map((p) => p.category)))
      expect(await screen.findByRole('button', { name: c })).toBeInTheDocument();
  });

  it('filtre par catégorie puis revient à « Tous »', async() => {
    renderApp('/projets');
    const mobileBtn = await screen.findByRole('button', { name: 'Mobile' });
    fireEvent.click(mobileBtn);
    
    const expectedCount = projects.filter((p) => p.category === 'Mobile').length;
    const projectLinks = await screen.findAllByRole('link', { name: /^Projet / });
    expect(projectLinks).toHaveLength(expectedCount);

    expect(mobileBtn).toHaveAttribute('aria-pressed', 'true');
    
    const tousBtn = await screen.findByRole('button', { name: /^Tous/ });
    fireEvent.click(tousBtn);
    
    expect(await screen.findAllByRole('link', { name: /^Projet / })).toHaveLength(
      projects.length
    );
  });

  it('recherche sans accents ; aucun résultat annoncé', async() => {
      renderApp('/projets');
      const searchInput = await screen.findByLabelText('Rechercher un projet');
      
      // Recherche avec un terme accentué/normalisé
      fireEvent.change(searchInput, {
        target: { value: 'santé' },
      });
      
      // On calcule dynamiquement le nombre de projets correspondants sans la sensibilité aux accents
      const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const expectedCount = projects.filter(
        (p) => normalize(p.title).includes('sante') || normalize(p.summary).includes('sante')
      ).length;
      
      expect(await screen.findAllByRole('link', { name: /^Projet / })).toHaveLength(expectedCount);
      
      // Recherche avec un terme inexistant
      fireEvent.change(searchInput, {
        target: { value: 'zzzz' },
      });
      expect(await screen.findByRole('status')).toHaveTextContent(/Aucun projet/);
      expect(screen.queryAllByRole('link', { name: /^Projet / })).toHaveLength(0);
  });

  it('le filtre persiste quand on quitte la page puis qu’on y revient', async () => {
    renderApp('/projets');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Mobile' })
    );

    const nav = async () =>
      within(
        await screen.findByRole('navigation', {
          name: /principale/i,
        })
      );

    fireEvent.click(
      await (await nav()).findByRole('link', { name: 'À propos' })
    );

    await screen.findByRole('heading', { name: /Compétences/ });

    fireEvent.click(
      await (await nav()).findByRole('link', { name: 'Projets' })
    );

    expect(
      await screen.findByRole('button', { name: 'Mobile' })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Détail d’un projet', () => {
  it('affiche le défi, la solution, la fiche et les indicateurs', async () => {
    renderApp(`/projets/${projects[0].slug}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: projects[0].title })
    ).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Le défi' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'La solution' })).toBeInTheDocument();
    expect(await screen.findByText(projects[0].results[0].label)).toBeInTheDocument();
    expect((await screen.findByText('Rôle')).closest('div')).toHaveTextContent(projects[0].role);
  });
  it('projet suivant (en boucle) et navigation vers lui', async () => {
    renderApp(`/projets/${projects[0].slug}`);
    fireEvent.click(await screen.findByRole('link', { name: new RegExp(projects[1].title) }));
    expect(
      await screen.findByRole('heading', { level: 1, name: projects[1].title })
    ).toBeInTheDocument();
  });
  it('slug inconnu : message clair et retour à la liste', async () => {
    renderApp('/projets/nexiste-pas');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/introuvable/);
    expect(await screen.findByRole('link', { name: /Tous les projets/ })).toHaveAttribute(
      'href',
      '/projets'
    );
  });
  it('pas de lien externe si l’URL n’est pas en http(s)', () => {
    renderApp(`/projets/${projects[0].slug}`);
    expect(screen.queryByRole('link', { name: /Voir le site/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Code source/ })).toBeNull();
  });
});

describe('Page Contact', () => {
  const fill = async (o = {}) => {
    const v = {
      nom: 'Ada Lovelace',
      email: 'ada@ex.com',
      sujet: 'Mandat',
      message: 'Bonjour, parlons de votre projet.',
      ...o,
    };

    fireEvent.change(await screen.findByLabelText('Nom'), {
      target: { value: v.nom },
    });

    fireEvent.change(await screen.findByLabelText('Courriel'), {
      target: { value: v.email },
    });

    fireEvent.change(await screen.findByLabelText('Sujet'), {
      target: { value: v.sujet },
    });

    fireEvent.change(await screen.findByLabelText('Message'), {
      target: { value: v.message },
    });
  };

  it('affiche le formulaire, la disponibilité et le honeypot caché', async () => {
    renderApp('/contact');
    expect( await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Parlons projet/);
    expect(
      await screen.findByRole('form', { name: /Formulaire de contact/ })
    ).toBeInTheDocument();
    const honey = await screen.findByLabelText('Ne pas remplir');
    expect(honey.closest('[aria-hidden=true]')).not.toBeNull();
    expect(honey).toHaveAttribute('tabindex', '-1');
  });

  it('envoi réussi : confirmation, puis possibilité d’écrire un autre message', async () => {
    const { services } = renderApp('/contact');
    await fill();
    fireEvent.click( await screen.findByRole('button', { name: /Envoyer le message/ }));
    expect(await screen.findByText('Message envoyé.')).toBeInTheDocument();
    expect(services.contactService.send).toHaveBeenCalledWith({
      nom: 'Ada Lovelace',
      email: 'ada@ex.com',
      sujet: 'Mandat',
      message: 'Bonjour, parlons de votre projet.',
      website: '',
    });
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer un autre message/ }));
    expect(await screen.findByLabelText('Nom')).toHaveValue('');
  });

  it('validation (vrai service) : erreur affichée, aucun appel API', async () => {
    const repo = { send: vi.fn() };
    renderApp('/contact', makeServices({ contactService: new ContactService(repo) }));
    await fill({ email: 'pas-un-courriel' });
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer le message/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/courriel invalide/i);
    expect(repo.send).not.toHaveBeenCalled();
    await fill({ message: 'court' });
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer le message/ }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/10 caractères|courriel/)
    );
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
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer le message/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de requêtes');
    expect(await screen.findByLabelText('Nom')).toHaveValue('Ada Lovelace');
  });

  it('le honeypot rempli est transmis (le serveur l’ignore)', async () => {
    const { services } = renderApp('/contact');
    await fill();
    fireEvent.change(await screen.findByLabelText('Ne pas remplir'), {
      target: { value: 'http://spam' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer le message/ }));
    await waitFor(() => expect(services.contactService.send).toHaveBeenCalled());
    expect(services.contactService.send.mock.calls[0][0].website).toBe('http://spam');
  });

  it('bouton désactivé pendant l’envoi (pas de double envoi)', async () => {
    let resolve;
    const send = vi.fn(() => new Promise((r) => (resolve = r)));
    renderApp('/contact', makeServices({ contactService: { send } }));
    await fill();
    fireEvent.click(await screen.findByRole('button', { name: /Envoyer le message/ }));
    expect(await screen.findByRole('button', { name: 'Envoi…' })).toBeDisabled();
    resolve({});
    expect(await screen.findByText('Message envoyé.')).toBeInTheDocument();
  });
});