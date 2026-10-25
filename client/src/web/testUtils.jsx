import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore } from './store/store.js';
import AppRouter from './routes/AppRouter.jsx';
import ContentService from '../bll/services/ContentService.js';
import ContactService from '../bll/services/ContactService.js';
import * as siteContent from '../domain/content/siteContent.js';

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
export function makeServices(overrides = {}) {
  return {
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
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>
  );
  return { ...utils, store, services };
}
