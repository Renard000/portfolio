import fs from 'node:fs';
import path from 'node:path';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createStore } from './store/store.js';
import AppRouter from './routes/AppRouter.jsx';
import { LocaleContext } from './context/withLocale.jsx';
import { makeServices, renderApp } from './testUtils.jsx';
import LocaleService from '../bll/services/LocaleService.js';
import ContentService from '../bll/services/ContentService.js';
import ArticleService from '../bll/services/ArticleService.js';
import CertificationService from '../bll/services/CertificationService.js';
import { applyTranslation, cleanTranslation } from '../domain/translation.js';
import { metaForPath } from '../domain/content/seoContent.js';
import { newsletterPages } from '../domain/content/newsletterContent.js';
import * as english from '../domain/content/en.js';
import * as siteContent from '../domain/content/siteContent.js';

function renderEnglish(url, services = makeServices()) {
  const locale = new LocaleService(
    { get: () => 'en', set: vi.fn() },
    { en: english.ui },
    vi.fn()
  );
  return render(
    <Provider store={createStore(services)}>
      <LocaleContext.Provider value={locale}>
        <HelmetProvider>
          <MemoryRouter initialEntries={[url]}>
            <AppRouter />
          </MemoryRouter>
        </HelmetProvider>
      </LocaleContext.Provider>
    </Provider>
  );
}

const sources = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return sources(full);
    return /\.jsx$/.test(e.name) && !e.name.includes('.test') ? [full] : [];
  });

describe('Dictionnaire anglais', () => {
  it('chaque texte traduit des vues publiques existe dans le dictionnaire', () => {
    const root = path.resolve(process.cwd(), 'src/web/views');
    const missing = [];
    for (const file of sources(root)) {
      const code = fs.readFileSync(file, 'utf8');
      for (const m of code.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)+)'/g)) {
        const key = m[1].replace(/\\'/g, "'");
        if (!(key in english.ui)) missing.push(`${path.basename(file)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('pages de la newsletter et titres des pages traduits', () => {
    const texts = Object.values(newsletterPages).flatMap((group) =>
      Object.values(group).flatMap((p) => [p.kicker, p.title, p.message, p.action.label])
    );
    for (const url of ['/', '/a-propos', '/projets', '/blog', '/contact', '/admin']) {
      const meta = metaForPath(url);
      texts.push(meta.title);
      if (meta.description) texts.push(meta.description);
    }
    expect(texts.filter((t) => !(t in english.ui))).toEqual([]);
  });

  it('tous les projets locaux ont leur version anglaise', () => {
    const slugs = siteContent.projects.map((p) => p.slug);
    expect(slugs.filter((s) => !english.projects[s])).toEqual([]);
  });

  it('accueil en anglais, français conservé pour un texte non traduit', () => {
    const t = new LocaleService(
      { get: () => 'en' },
      { en: { Bonjour: 'Hello {name}' } },
      vi.fn()
    ).t;
    expect(t('Bonjour', { name: 'Flo' })).toBe('Hello Flo');
    expect(t('Texte inconnu')).toBe('Texte inconnu');
  });
});

describe('Site en anglais', () => {
  it('navigation, accueil et titre de l’onglet', async () => {
    renderEnglish('/');
    const nav = await screen.findByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByRole('link', { name: 'Courses' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Featured projects' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Switch the site to French' })
    ).toHaveTextContent('FR');
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });

  it('pages légales et certifications', async () => {
    renderEnglish('/conditions');
    expect(
      await screen.findByRole('heading', { name: 'Terms of use', level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText('Content ownership')).toBeInTheDocument();
  });

  it('le bouton de langue demande le changement', async () => {
    const { services } = renderApp('/');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Passer le site en anglais' })
    );
    expect(services.localeService.toggle).toHaveBeenCalledOnce();
  });
});

describe('Traduction des contenus', () => {
  it('applyTranslation : champs remplis seulement, à toute profondeur', () => {
    expect(
      applyTranslation({
        items: [
          { title: 'Bonjour', excerpt: 'Résumé', en: { title: 'Hello', excerpt: '' } },
        ],
        total: 1,
      })
    ).toEqual({
      items: [{ title: 'Hello', excerpt: 'Résumé', en: { title: 'Hello', excerpt: '' } }],
      total: 1,
    });
    expect(applyTranslation(null)).toBeNull();
  });

  it('cleanTranslation retire les champs vides', () => {
    expect(cleanTranslation({ title: ' Hi ', description: '  ', role: null })).toEqual({
      title: 'Hi',
    });
    expect(cleanTranslation(undefined)).toEqual({});
  });

  it('ContentService.localize : profil, compétences et projets', () => {
    const { profile, projects } = ContentService.localize(siteContent, english);
    expect(profile.availability).toBe('Available for new projects');
    expect(profile.email).toBe(siteContent.profile.email);
    expect(profile.skills.map((s) => s.name)).toContain('UX and accessibility');
    const finova = projects.find((p) => p.slug === 'finova');
    expect(finova.category).toBe('AI');
    expect(finova.tech).toEqual(siteContent.projects[1].tech);
  });

  it('dates et nombres selon la langue', () => {
    expect(ArticleService.formatDate('2026-10-23T12:00:00Z', true, 'en-CA')).toMatch(
      /Oct.*23.*2026/
    );
    expect(ArticleService.compact(1248, 'en-CA')).toBe('1.2k');
    expect(ArticleService.compact(2000, 'en-CA')).toBe('2k');
    const now = new Date('2026-10-29T12:00:00Z');
    expect(ArticleService.relative('2026-10-24T10:00:00Z', now, 'en-CA')).toBe(
      '5 days ago'
    );
  });

  it('la version anglaise part avec le formulaire de l’admin', () => {
    const dto = CertificationService.toDto({
      title: 'T',
      issuer: 'I',
      issueDate: '2024-01-01',
      en: { title: 'Title', description: '' },
    });
    expect(dto.en).toEqual({ title: 'Title' });
  });
});
