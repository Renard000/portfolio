import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createStore } from './store/store.js';
import AppRouter from './routes/AppRouter.jsx';
import ProgressService from '../bll/services/ProgressService.js';
import ContentService from '../bll/services/ContentService.js';
import ContactService from '../bll/services/ContactService.js';
import * as siteContent from '../domain/content/siteContent.js';

/** Faux repository de progression en mémoire (la couche web n'importe pas la DAL). */
export class MemoryProgressRepo {
  constructor() {
    this.data = {};
  }
  get(id) {
    return this.data[id] || null;
  }
  set(id, v) {
    this.data[id] = v;
  }
}

export const CERTS = [
  {
    id: 'c1',
    title: 'AWS Cloud Practitioner',
    issuer: 'Amazon',
    category: 'Cloud',
    description: 'Bases du cloud',
    issueDate: '2024-03-15',
    expiryDate: '2027-03-15',
    credentialId: 'AWS-123',
    credentialUrl: 'https://verif.example/aws',
    imageUrl: null,
    documentUrl: null,
    skills: ['S3', 'EC2'],
    featured: true,
    sortOrder: 0,
    status: 'valid',
  },
  {
    id: 'c2',
    title: 'Scrum Master',
    issuer: 'Scrum.org',
    category: 'Gestion',
    description: null,
    issueDate: '2022-06-01',
    expiryDate: '2023-06-01',
    credentialId: null,
    credentialUrl: 'javascript:alert(1)',
    imageUrl: null,
    documentUrl: null,
    skills: [],
    featured: false,
    sortOrder: 0,
    status: 'expired',
  },
  {
    id: 'c3',
    title: 'Cybersécurité Cisco',
    issuer: 'Cisco',
    category: 'Sécurité',
    description: null,
    issueDate: '2023-01-10',
    expiryDate: null,
    credentialId: null,
    credentialUrl: null,
    imageUrl: null,
    documentUrl: 'https://cdn.example/doc.pdf',
    skills: ['Firewall'],
    featured: true,
    sortOrder: 0,
    status: 'no-expiry',
  },
];

export const AWARDS = {
  items: [
    {
      id: 'a1',
      title: 'Bourse Excellence',
      type: 'scholarship',
      organization: 'Fondation X',
      description: 'Pour le mérite',
      amount: 2500,
      currency: 'CAD',
      awardedAt: '2024-09-01',
      documentUrl: 'https://cdn.example/just.pdf',
      year: 2024,
    },
    {
      id: 'a2',
      title: 'Prix du jury',
      type: 'award',
      organization: 'Hackathon',
      description: null,
      amount: null,
      currency: 'CAD',
      awardedAt: '2024-02-01',
      year: 2024,
    },
    {
      id: 'a3',
      title: 'Mérite scolaire',
      type: 'merit',
      organization: 'Cégep',
      description: null,
      amount: null,
      currency: 'CAD',
      awardedAt: '2022-05-01',
      year: 2022,
    },
  ],
  totals: { count: 3, scholarshipAmounts: { CAD: 2500 } },
};

/** Services factices : aucun réseau. */
export const ARTICLES = [
  {
    id: 'a1',
    title: 'Redux sans hooks',
    slug: 'redux-sans-hooks',
    excerpt: 'connect et classes.',
    category: 'React',
    status: 'published',
    views: 1248,
    likes: 58,
    comments: 2,
    readingMinutes: 8,
    publishedAt: '2026-10-23T10:00:00Z',
  },
  {
    id: 'a2',
    title: 'Express en couches',
    slug: 'express-en-couches',
    excerpt: 'Web, BLL, DAL.',
    category: 'Node',
    status: 'draft',
    views: 0,
    likes: 0,
    comments: 0,
    readingMinutes: 6,
    publishedAt: null,
  },
];

export const ARTICLE_DETAIL = {
  article: {
    ...ARTICLES[0],
    content:
      '## Intertitre\n\nTexte **gras**.\n\n```js\nconst x = 1;\n```\n\n<script>alert(1)</script>',
  },
  comments: [
    { id: 'm1', author: 'Ada', content: 'Très clair', createdAt: '2026-10-25T10:00:00Z' },
  ],
  related: [{ ...ARTICLES[1], status: 'published', publishedAt: '2026-10-12T10:00:00Z' }],
};

export const COMMENTS = [
  {
    id: 'co1',
    author: 'Bob',
    content: 'En attente',
    approved: false,
    createdAt: '2026-10-28T10:00:00Z',
    article: { title: 'Redux sans hooks', slug: 'redux-sans-hooks' },
  },
  {
    id: 'co2',
    author: 'Ada',
    content: 'Approuvé',
    approved: true,
    createdAt: '2026-10-20T10:00:00Z',
    article: { title: 'Redux sans hooks', slug: 'redux-sans-hooks' },
  },
];

export const MESSAGES = [
  {
    id: 'ms1',
    nom: 'Grace',
    email: 'grace@ex.com',
    sujet: 'Mandat',
    message: 'Bonjour, un projet ?',
    lu: false,
    createdAt: '2026-10-28T10:00:00Z',
  },
  {
    id: 'ms2',
    nom: 'Alan',
    email: 'alan@ex.com',
    sujet: null,
    message: 'Message déjà lu.',
    lu: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
];

export const DASHBOARD = {
  views: { last30Days: 1248, changePct: 12 },
  articles: { published: 40, drafts: 2 },
  unreadMessages: 2,
  pendingComments: 3,
  subscribers: { confirmed: 86, newThisWeek: 5 },
  viewsByMonth: [
    { month: '2025-11-01', views: 300 },
    { month: '2026-10-01', views: 950 },
  ],
  topArticles: [
    { id: 'a1', title: 'Redux sans hooks', slug: 'redux-sans-hooks', views: 1248 },
  ],
  topVideos: [{ id: 'v1', title: 'Intro React', views: 402 }],
  publishedVideoSeconds: 51600,
};

export function makeServices(overrides = {}) {
  return {
    videoService: {
      listSeries: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1 }),
      getSeries: vi.fn(),
      getVideo: vi.fn(),
      getPlayback: vi.fn(),
      registerView: vi.fn().mockResolvedValue(),
    },
    progressService: new ProgressService(new MemoryProgressRepo()),
    videoAdminService: { listSeries: vi.fn().mockResolvedValue([]), getSeries: vi.fn() },
    contentService: new ContentService(siteContent),
    contactService: { send: vi.fn().mockResolvedValue({ status: 'received' }) },
    certificationService: {
      list: vi.fn().mockResolvedValue(CERTS),
      create: vi.fn(async (d) => ({ id: 'new', ...d })),
      update: vi.fn(async (id, d) => ({ id, ...d })),
      remove: vi.fn().mockResolvedValue(null),
    },
    awardService: {
      list: vi.fn().mockResolvedValue(AWARDS),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue(null),
    },
    newsletterService: { subscribe: vi.fn().mockResolvedValue({ status: 'pending' }) },
    pushService: { enable: vi.fn().mockResolvedValue('subscribed') },
    uploadService: {
      upload: vi.fn().mockResolvedValue('https://cdn.example/uploaded.png'),
    },
    subscriberAdminService: {
      list: vi.fn().mockResolvedValue({
        newsletter: [
          {
            id: 'n1',
            email: 'ada@ex.com',
            active: true,
            confirmed: true,
            createdAt: '2026-01-02T00:00:00Z',
          },
        ],
        push: [
          {
            id: 'p1',
            token: 'abcdef…wxyz',
            active: true,
            createdAt: '2026-01-03T00:00:00Z',
          },
        ],
      }),
      removeNewsletter: vi.fn().mockResolvedValue(),
      removePush: vi.fn().mockResolvedValue(),
      sendTestEmail: vi.fn().mockResolvedValue(),
    },
    articleService: {
      list: vi.fn().mockResolvedValue({
        items: ARTICLES,
        total: ARTICLES.length,
        page: 1,
        pages: 1,
        categories: ['React', 'Node'],
      }),
      get: vi.fn().mockResolvedValue(ARTICLE_DETAIL),
      view: vi.fn().mockResolvedValue(),
      like: vi.fn().mockResolvedValue(59),
      comment: vi.fn().mockResolvedValue({ status: 'pending' }),
      listAll: vi.fn().mockResolvedValue(ARTICLES),
      getById: vi.fn().mockResolvedValue(ARTICLE_DETAIL.article),
      save: vi.fn(async (id, d) => ({ id: id || 'new', status: 'draft', ...d })),
      publish: vi.fn(async (id) => ({
        ...ARTICLE_DETAIL.article,
        id,
        status: 'published',
      })),
      unpublish: vi.fn(async (id) => ({ id, status: 'draft', publishedAt: null })),
      remove: vi.fn().mockResolvedValue(null),
    },
    adminContentService: {
      dashboard: vi.fn().mockResolvedValue(DASHBOARD),
      listComments: vi.fn().mockResolvedValue(COMMENTS),
      moderateComment: vi.fn(async (id, approved) => ({ id, approved })),
      removeComment: vi.fn().mockResolvedValue(null),
      listMessages: vi.fn().mockResolvedValue(MESSAGES),
      markMessage: vi.fn(async (id, lu) => ({ id, lu })),
      removeMessage: vi.fn().mockResolvedValue(null),
    },
    portfolioAdminService: {
      listProjects: vi
        .fn()
        .mockResolvedValue([
          { id: 'p1', slug: 'ecotrack', title: 'EcoTrack', category: 'Mobile', tech: [] },
        ]),
      saveProject: vi.fn(async (id, d) => ({ id: id || 'np', ...d })),
      removeProject: vi.fn().mockResolvedValue(null),
      listSkills: vi.fn().mockResolvedValue([{ id: 'k1', name: 'React', level: 90 }]),
      saveSkill: vi.fn(async (id, d) => ({ id: id || 'nk', ...d })),
      removeSkill: vi.fn().mockResolvedValue(null),
    },
    authClient: {
      getSession: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockResolvedValue({ user: { email: 'admin@ex.com' } }),
      signOut: vi.fn().mockResolvedValue(),
    },
    ...overrides,
  };
}

export function renderApp(path, services = makeServices()) {
  const store = createStore(services);
  const utils = render(
    <Provider store={store}>
      <HelmetProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </HelmetProvider>
    </Provider>
  );
  return { ...utils, store, services };
}
