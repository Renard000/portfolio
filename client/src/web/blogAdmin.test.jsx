import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, makeServices, ARTICLE_DETAIL } from './testUtils.jsx';
import ArticleService from '../bll/services/ArticleService.js';
import MarkdownService from '../bll/services/MarkdownService.js';
import AdminContentService from '../bll/services/AdminContentService.js';
import PortfolioAdminService from '../bll/services/PortfolioAdminService.js';
import ContentService from '../bll/services/ContentService.js';
import * as siteContent from '../domain/content/siteContent.js';
import { toDashboardModel } from './controllers/AdminDashboardController.jsx';
import { DASHBOARD } from './testUtils.jsx';

const logged = (over = {}) => {
  const s = makeServices(over);
  s.authClient.getSession.mockResolvedValue({ user: { email: 'admin@ex.com' } });
  return s;
};

describe('Newsletter : pages d’arrivée des liens des courriels', () => {
  it('confirmation réussie', async () => {
    renderApp('/newsletter/confirmation?statut=ok');
    expect(
      await screen.findByRole('heading', { name: 'Abonnement confirmé.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lire le blog' })).toHaveAttribute(
      'href',
      '/blog'
    );
  });
  it('lien invalide ou statut inconnu', async () => {
    renderApp('/newsletter/confirmation?statut=nimporte');
    expect(
      await screen.findByRole('heading', { name: 'Lien invalide.' })
    ).toBeInTheDocument();
  });
  it('désinscription effectuée', async () => {
    renderApp('/newsletter/desinscription?statut=ok');
    expect(
      await screen.findByRole('heading', { name: 'Désinscription effectuée.' })
    ).toBeInTheDocument();
  });
});

describe('Blog public', () => {
  it('liste : article à la une, filtres, lien Blog actif dans la navigation', async () => {
    const { services } = renderApp('/blog');
    expect(
      await screen.findByRole('heading', { name: 'Redux sans hooks' })
    ).toBeInTheDocument();
    expect(screen.getByText('À la une')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: 'Blog' })).toHaveClass('active');
    fireEvent.click(screen.getByRole('button', { name: 'Node' }));
    await waitFor(() =>
      expect(services.articleService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'Node', page: 1 })
      )
    );
  });

  it('article : Markdown assaini, vue comptée, like, commentaire en attente', async () => {
    const { services, container } = renderApp('/blog/redux-sans-hooks');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Redux sans hooks' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Intertitre' })).toBeInTheDocument();
    expect(container.querySelector('article script')).toBeNull();
    expect(container.querySelector('pre .pf-copy')).not.toBeNull();
    expect(services.articleService.view).toHaveBeenCalledWith('a1');
    expect(screen.getByText('Très clair')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'J’aime' }));
    expect(await screen.findByText('59')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Votre nom'), { target: { value: 'Linus' } });
    fireEvent.change(screen.getByLabelText('Votre commentaire'), {
      target: { value: 'Merci !' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(await screen.findByText(/publié après modération/)).toBeInTheDocument();
    expect(services.articleService.comment).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ author: 'Linus', content: 'Merci !' })
    );
  });

  it('article introuvable : page 404', async () => {
    renderApp(
      '/blog/inconnu',
      makeServices({
        articleService: {
          ...makeServices().articleService,
          get: vi.fn().mockRejectedValue(new Error('Article introuvable')),
        },
      })
    );
    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});

describe('Admin : barre latérale et tableau de bord', () => {
  it('liens de la maquette et pastilles commentaires / messages', async () => {
    renderApp('/admin', logged());
    expect(
      await screen.findByRole('heading', { name: 'Tableau de bord' })
    ).toBeInTheDocument();
    const side = screen.getByRole('navigation', { name: 'Sections de l’administration' });
    for (const name of ['Projets', 'Articles', 'Compétences', 'Distinctions', 'Abonnés'])
      expect(
        within(side).getByRole('link', { name: new RegExp(name) })
      ).toBeInTheDocument();
    // 1 commentaire en attente, 1 message non lu (données de test)
    expect(await within(side).findAllByLabelText('1 à traiter')).toHaveLength(2);
    expect(await screen.findByText('Articles les plus lus')).toBeInTheDocument();
    expect(screen.getByText('3 commentaires à modérer')).toBeInTheDocument();
  });

  it('modèle du tableau de bord : variation, durée, barres', () => {
    const m = toDashboardModel(DASHBOARD);
    expect(m.stats.viewsNote).toBe('▲ 12 %');
    expect(m.stats.draftsNote).toBe('2 brouillons');
    expect(m.videoDuration).toBe('14 h 20');
    expect(m.bars.at(-1)).toMatchObject({ peak: true, height: 100 });
    expect(m.todo.map((t) => t.to)).toEqual([
      '/admin/commentaires',
      '/admin/messages',
      '/admin/articles',
    ]);
  });
});

describe('Admin : articles', () => {
  it('onglets de statut et dépublication', async () => {
    const { services } = renderApp('/admin/articles', logged());
    expect(await screen.findByText('Redux sans hooks')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Brouillons (1)' }));
    expect(screen.queryByText('Redux sans hooks')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tous (2)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dépublier Redux sans hooks' }));
    await waitFor(() =>
      expect(services.articleService.unpublish).toHaveBeenCalledWith('a1')
    );
  });

  it('éditeur : slug déduit du titre, aperçu assaini, publier et notifier', async () => {
    const { services, container } = renderApp('/admin/articles/nouveau', logged());
    fireEvent.change(await screen.findByLabelText('Titre de l’article'), {
      target: { value: 'Mon Été à Montréal' },
    });
    expect(screen.getByLabelText('Slug')).toHaveValue('mon-ete-a-montreal');
    fireEvent.change(screen.getByLabelText('Contenu en Markdown'), {
      target: { value: '**gras** <img src=x onerror=alert(1)>' },
    });
    await waitFor(() =>
      expect(container.querySelector('.pf-prose strong')).not.toBeNull()
    );
    expect(container.querySelector('.pf-prose img').getAttribute('onerror')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Publier et notifier →' }));
    await waitFor(() =>
      expect(services.articleService.publish).toHaveBeenCalledWith('new')
    );
    expect(services.articleService.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ slug: 'mon-ete-a-montreal', title: 'Mon Été à Montréal' })
    );
    expect(await screen.findByText(/abonnés sont notifiés/)).toBeInTheDocument();
  });

  it('éditeur : validation avant tout appel', async () => {
    const { services } = renderApp('/admin/articles/nouveau', logged());
    fireEvent.click(
      await screen.findByRole('button', { name: 'Enregistrer le brouillon' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Le titre est obligatoire.'
    );
    expect(services.articleService.save).not.toHaveBeenCalled();
  });

  it('éditeur : modification d’un article existant', async () => {
    const { services } = renderApp('/admin/articles/a1', logged());
    expect(await screen.findByLabelText('Titre de l’article')).toHaveValue(
      'Redux sans hooks'
    );
    expect(services.articleService.getById).toHaveBeenCalledWith('a1');
    // Article publié : on enregistre ou on dépublie
    expect(screen.getByRole('button', { name: 'Dépublier' })).toBeInTheDocument();
  });
});

describe('Admin : modération et messages', () => {
  it('approuver un commentaire, marquer un message comme lu', async () => {
    const { services } = renderApp('/admin/commentaires', logged());
    expect(
      await screen.findByRole('heading', { name: 'Modération et messages' })
    ).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Approuver' }));
    await waitFor(() =>
      expect(services.adminContentService.moderateComment).toHaveBeenCalledWith(
        'co1',
        true
      )
    );
    expect(screen.getByRole('link', { name: 'Répondre' })).toHaveAttribute(
      'href',
      'mailto:grace%40ex.com?subject=Re%3A%20Mandat'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme lu' }));
    await waitFor(() =>
      expect(services.adminContentService.markMessage).toHaveBeenCalledWith('ms1', true)
    );
  });

  it('suppression avec confirmation', async () => {
    const { services } = renderApp('/admin/messages', logged());
    fireEvent.click(
      await screen.findByRole('button', { name: 'Supprimer le message de Grace' })
    );
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Supprimer' })
    );
    await waitFor(() =>
      expect(services.adminContentService.removeMessage).toHaveBeenCalledWith('ms1')
    );
  });
});

describe('Admin : projets et compétences', () => {
  it('ajouter un projet (slug déduit du titre)', async () => {
    const { services } = renderApp('/admin/projets', logged());
    expect(await screen.findByText('EcoTrack')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText('Titre *'), {
      target: { value: 'Finova IA' },
    });
    fireEvent.change(screen.getByLabelText(/Technologies/), {
      target: { value: 'C#, Python, C#' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() =>
      expect(services.portfolioAdminService.saveProject).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ slug: 'finova-ia', tech: ['C#', 'Python'] })
      )
    );
  });

  it('compétence : niveau hors limites refusé', async () => {
    const { services } = renderApp('/admin/competences', logged());
    expect(await screen.findByText('React')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Go' } });
    fireEvent.change(screen.getByLabelText('Niveau (%) *'), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('entre 0 et 100');
    expect(services.portfolioAdminService.saveSkill).not.toHaveBeenCalled();
  });

  it('anciennes adresses admin toujours valides', async () => {
    renderApp('/admin/subscribers', logged());
    expect(await screen.findByRole('link', { name: 'Abonnés' })).toHaveClass('active');
  });
});

describe('BLL client', () => {
  it('ArticleService : slug, dates, nombres compacts', () => {
    expect(ArticleService.slugify('  Été : React & Node ! ')).toBe('ete-react-node');
    expect(ArticleService.formatDate('2026-10-23T10:00:00Z')).toBe('23 oct. 2026');
    expect(ArticleService.compact(1248)).toBe('1,2 k');
    expect(ArticleService.compact(2000)).toBe('2 k');
    const now = new Date('2026-10-29T12:00:00Z');
    expect(ArticleService.relative('2026-10-29T10:00:00Z', now)).toBe('il y a 2 h');
    expect(ArticleService.relative('2026-10-28T10:00:00Z', now)).toBe('hier');
    expect(ArticleService.relative('2026-10-24T10:00:00Z', now)).toBe('il y a 5 j');
  });

  it('MarkdownService : retire scripts, gestionnaires et liens javascript:', () => {
    const html = MarkdownService.render(
      '[x](javascript:alert(1)) <script>alert(1)</script> <b onclick="x()">ok</b>'
    );
    expect(html).not.toMatch(/script|onclick|javascript:/i);
    expect(html).toContain('<b>ok</b>');
  });

  it('AdminContentService : durée et pastilles', () => {
    expect(AdminContentService.formatDuration(600)).toBe('10 min');
    expect(
      AdminContentService.badges({
        comments: [{ approved: false }, { approved: true }],
        messages: [{ lu: false }],
      })
    ).toEqual({ comments: 1, messages: 1 });
  });

  it('PortfolioAdminService : validation projet', () => {
    expect(
      PortfolioAdminService.validateProject({ title: 'X', slug: 'Pas Bon' })
    ).toMatch(/Slug/);
    expect(
      PortfolioAdminService.validateProject({ title: 'X', slug: 'x', color: 'rouge' })
    ).toMatch(/#RRGGBB/);
    expect(
      PortfolioAdminService.toProjectDto({ title: ' X ', slug: 'x', results: 'a\n\nb' })
        .results
    ).toEqual(['a', 'b']);
  });

  it('ContentService : API si non vide, sinon fichier local (même en cas de panne)', async () => {
    const api = new ContentService(siteContent, {
      projectRepository: {
        list: async () => [{ id: '1', slug: 'p', title: 'P', tech: [] }],
      },
      skillRepository: { list: async () => [{ name: 'Go', level: 70 }] },
    });
    const fromApi = await api.getAll();
    expect(fromApi.projects).toHaveLength(1);
    expect(fromApi.projects[0].color).toMatch(/^#/);
    expect(fromApi.profile.skills).toEqual([{ name: 'Go', level: 70 }]);
    expect(fromApi.profile.name).toBe(siteContent.profile.name);

    const down = new ContentService(siteContent, {
      projectRepository: { list: async () => Promise.reject(new Error('panne')) },
      skillRepository: { list: async () => [] },
    });
    const local = await down.getAll();
    expect(local.projects).toBe(siteContent.projects);
    expect(local.profile.skills).toBe(siteContent.profile.skills);
  });
});

// Le détail de test sert aussi à vérifier que le Markdown d'exemple contient bien un script
it('les données de test contiennent un script à neutraliser', () => {
  expect(ARTICLE_DETAIL.article.content).toContain('<script>');
});
