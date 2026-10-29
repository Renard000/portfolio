import { describe, it, expect, vi } from 'vitest';
import CertificationRepository from '../../src/dal/repositories/CertificationRepository.js';
import AwardRepository from '../../src/dal/repositories/AwardRepository.js';
import NewsletterRepository from '../../src/dal/repositories/NewsletterRepository.js';
import PushSubscriptionRepository from '../../src/dal/repositories/PushSubscriptionRepository.js';
import AuthRepository from '../../src/dal/repositories/AuthRepository.js';
import EmailClient, {
  ConsoleEmailClient,
  parseAddress,
} from '../../src/dal/clients/EmailClient.js';
import FirebaseAdmin from '../../src/dal/clients/FirebaseAdmin.js';
import Certification from '../../src/domain/entities/Certification.js';

/** Faux client Supabase : enregistre la chaîne d'appels, répond avec `result`. */
function fakeSupabase(result) {
  const calls = [];
  const builder = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') return (res, rej) => Promise.resolve(result).then(res, rej);
        return (...args) => {
          calls.push([prop, ...args]);
          return builder;
        };
      },
    }
  );
  return {
    from: (t) => (calls.push(['from', t]), builder),
    calls,
    auth: { getUser: vi.fn() },
  };
}
const call = (sb, name) => sb.calls.find((c) => c[0] === name);

const certRow = {
  id: 'c1',
  title: 'AWS',
  issuer: 'Amazon',
  category: 'Cloud',
  description: null,
  issue_date: '2024-01-01',
  expiry_date: '2027-01-01',
  credential_id: 'ABC',
  credential_url: 'https://v',
  image_url: null,
  document_url: null,
  skills: ['s3'],
  featured: true,
  sort_order: 2,
  created_at: 't',
};

describe('CertificationRepository', () => {
  it('convertit snake_case → entité et trie (sort_order, issue_date desc)', async () => {
    const sb = fakeSupabase({ data: [certRow], error: null });
    const [c] = await new CertificationRepository(sb).list();
    expect(c).toBeInstanceOf(Certification);
    expect(c).toMatchObject({
      issueDate: '2024-01-01',
      expiryDate: '2027-01-01',
      credentialId: 'ABC',
      sortOrder: 2,
      featured: true,
    });
    expect(call(sb, 'from')[1]).toBe('certifications');
    expect(sb.calls.filter((x) => x[0] === 'order').map((x) => x[1])).toEqual([
      'sort_order',
      'issue_date',
    ]);
  });
  it('create : convertit camelCase → colonnes, sans clés inconnues', async () => {
    const sb = fakeSupabase({ data: certRow, error: null });
    await new CertificationRepository(sb).create({
      title: 'A',
      issuer: 'B',
      issueDate: '2024-01-01',
      imageUrl: 'https://i',
      hack: 'x',
      id: 'forged',
    });
    expect(call(sb, 'insert')[1]).toEqual({
      title: 'A',
      issuer: 'B',
      issue_date: '2024-01-01',
      image_url: 'https://i',
    });
  });
  it('update inconnu → null ; delete → booléen', async () => {
    expect(
      await new CertificationRepository(fakeSupabase({ data: null, error: null })).update(
        'x',
        { title: 'a' }
      )
    ).toBeNull();
    expect(
      await new CertificationRepository(fakeSupabase({ data: [], error: null })).delete(
        'x'
      )
    ).toBe(false);
    expect(
      await new CertificationRepository(
        fakeSupabase({ data: [{ id: 'x' }], error: null })
      ).delete('x')
    ).toBe(true);
  });
  it('lève une erreur claire si Supabase échoue', async () => {
    const repo = new CertificationRepository(
      fakeSupabase({ data: null, error: { message: 'boom' } })
    );
    await expect(repo.list()).rejects.toThrow('Erreur base de données : boom');
  });
});

describe('AwardRepository', () => {
  it('mappe les colonnes et convertit le montant en nombre', async () => {
    const sb = fakeSupabase({
      data: [
        {
          id: 'a',
          title: 'T',
          type: 'scholarship',
          organization: 'O',
          amount: '1200.50',
          currency: 'CAD',
          awarded_at: '2024-05-01',
          featured: false,
          sort_order: 0,
        },
      ],
      error: null,
    });
    const [a] = await new AwardRepository(sb).list();
    expect(a.amount).toBe(1200.5);
    expect(a.awardedAt).toBe('2024-05-01');
    expect(call(sb, 'from')[1]).toBe('awards');
  });
  it('create envoie awarded_at / document_url', async () => {
    const sb = fakeSupabase({
      data: { id: 'a', title: 'T', organization: 'O', awarded_at: '2024-01-01' },
      error: null,
    });
    await new AwardRepository(sb).create({
      title: 'T',
      organization: 'O',
      awardedAt: '2024-01-01',
      documentUrl: 'https://d',
    });
    expect(call(sb, 'insert')[1]).toEqual({
      title: 'T',
      organization: 'O',
      awarded_at: '2024-01-01',
      document_url: 'https://d',
    });
  });
});

describe('NewsletterRepository', () => {
  const row = {
    id: 'n',
    email: 'a@b.co',
    active: true,
    confirm_token: 'ct',
    unsubscribe_token: 'ut',
    confirmed_at: null,
    unsubscribed_at: null,
    created_at: 't',
  };
  it('cible la table subscribers et mappe les jetons', async () => {
    const sb = fakeSupabase({ data: row, error: null });
    const s = await new NewsletterRepository(sb).findByConfirmToken('ct');
    expect(call(sb, 'from')[1]).toBe('subscribers');
    expect(call(sb, 'eq')).toEqual(['eq', 'confirm_token', 'ct']);
    expect(s).toMatchObject({ confirmToken: 'ct', unsubscribeToken: 'ut' });
  });
  it('listReceivers filtre : actif, confirmé, non désinscrit', async () => {
    const sb = fakeSupabase({ data: [], error: null });
    await new NewsletterRepository(sb).listReceivers();
    expect(sb.calls).toEqual(
      expect.arrayContaining([
        ['eq', 'active', true],
        ['not', 'confirmed_at', 'is', null],
        ['is', 'unsubscribed_at', null],
      ])
    );
  });
  it('findByEmail neutralise les jokers LIKE (% _ \\)', async () => {
    const sb = fakeSupabase({ data: null, error: null });
    await new NewsletterRepository(sb).findByEmail('a_b%c@x.co');
    expect(call(sb, 'ilike')).toEqual(['ilike', 'email', 'a\\_b\\%c@x.co']);
  });
  it('update traduit les clés camelCase', async () => {
    const sb = fakeSupabase({ data: row, error: null });
    await new NewsletterRepository(sb).update('n', {
      active: false,
      confirmedAt: null,
      unsubscribedAt: 'now',
    });
    expect(call(sb, 'update')[1]).toEqual({
      active: false,
      confirmed_at: null,
      unsubscribed_at: 'now',
    });
  });
});

describe('PushSubscriptionRepository', () => {
  it('upsert sur fcm_token, réactive (active=true)', async () => {
    const sb = fakeSupabase({
      data: { id: 'p', fcm_token: 'tok', active: true },
      error: null,
    });
    await new PushSubscriptionRepository(sb).upsert('tok');
    expect(call(sb, 'from')[1]).toBe('push_subscriptions');
    expect(call(sb, 'upsert').slice(1)).toEqual([
      { fcm_token: 'tok', active: true },
      { onConflict: 'fcm_token' },
    ]);
  });
  it('deactivate : liste vide → aucun appel ; sinon active=false sur ces jetons', async () => {
    const sb = fakeSupabase({ data: null, error: null });
    await new PushSubscriptionRepository(sb).deactivate([]);
    expect(sb.calls).toHaveLength(0);
    await new PushSubscriptionRepository(sb).deactivate(['a', 'b']);
    expect(call(sb, 'update')[1]).toEqual({ active: false });
    expect(call(sb, 'in')).toEqual(['in', 'fcm_token', ['a', 'b']]);
  });
});

describe('AuthRepository', () => {
  it('jeton invalide → null ; valide → id/email', async () => {
    const sb = fakeSupabase({});
    sb.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'bad' },
    });
    expect(await new AuthRepository(sb).getUserFromToken('x')).toBeNull();
    sb.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'u', email: 'e', secret: 's' } },
      error: null,
    });
    expect(await new AuthRepository(sb).getUserFromToken('x')).toEqual({
      id: 'u',
      email: 'e',
    });
  });
  it('getRole lit profiles.role', async () => {
    const sb = fakeSupabase({ data: { role: 'admin' }, error: null });
    expect(await new AuthRepository(sb).getRole('u')).toBe('admin');
    expect(call(sb, 'from')[1]).toBe('profiles');
  });
});

describe('EmailClient', () => {
  it('POST vers Resend avec clé, expéditeur, destinataire', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    await new EmailClient('KEY', 'Moi <a@b.co>', f).send({
      to: 'x@y.co',
      subject: 'S',
      html: '<p>h</p>',
    });
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opts.headers.Authorization).toBe('Bearer KEY');
    expect(JSON.parse(opts.body)).toEqual({
      from: 'Moi <a@b.co>',
      to: ['x@y.co'],
      subject: 'S',
      html: '<p>h</p>',
    });
  });
  it('clé Brevo (xkeysib-) : POST vers Brevo avec en-tête api-key et expéditeur décomposé', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    await new EmailClient('xkeysib-KEY', 'Portfolio <moi@ex.co>', f).send({
      to: 'x@y.co',
      subject: 'S',
      html: '<p>h</p>',
    });
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(opts.headers['api-key']).toBe('xkeysib-KEY');
    expect(opts.headers.Authorization).toBeUndefined();
    expect(JSON.parse(opts.body)).toEqual({
      sender: { name: 'Portfolio', email: 'moi@ex.co' },
      to: [{ email: 'x@y.co' }],
      subject: 'S',
      htmlContent: '<p>h</p>',
    });
  });
  it('parseAddress : avec ou sans nom', () => {
    expect(parseAddress('a@b.co')).toEqual({ email: 'a@b.co' });
    expect(parseAddress('<a@b.co>')).toEqual({ email: 'a@b.co' });
    expect(parseAddress('Mon Nom <a@b.co>')).toEqual({
      name: 'Mon Nom',
      email: 'a@b.co',
    });
  });
  it('erreur HTTP : lève sans fuiter la clé ni le contenu', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 422 });
    const err = await new EmailClient('SECRETKEY', 'a@b.co', f)
      .send({ to: 'x@y.co', subject: 'S', html: 'SECRETBODY' })
      .catch((e) => e);
    expect(err.message).toContain('422');
    expect(err.message).not.toContain('SECRETKEY');
    expect(err.message).not.toContain('SECRETBODY');
  });
  it('ConsoleEmailClient journalise seulement destinataire et sujet', async () => {
    const logger = { log: vi.fn() };
    await new ConsoleEmailClient(logger).send({
      to: 'a@b.co',
      subject: 'S',
      html: 'secret',
    });
    expect(logger.log.mock.calls[0][0]).toContain('a@b.co');
    expect(logger.log.mock.calls[0][0]).not.toContain('secret');
  });
});

describe('FirebaseAdmin', () => {
  it('liste vide : aucun appel FCM', async () => {
    const getMessaging = vi.fn();
    expect(
      await new FirebaseAdmin(getMessaging).sendToTokens([], {
        title: 't',
        body: 'b',
        url: 'u',
      })
    ).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
    expect(getMessaging).not.toHaveBeenCalled();
  });
  it('repère messaging/registration-token-not-registered (et invalid-registration-token)', async () => {
    const messaging = {
      sendEachForMulticast: vi.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 3,
        responses: [
          { success: true },
          {
            success: false,
            error: { code: 'messaging/registration-token-not-registered' },
          },
          { success: false, error: { code: 'messaging/invalid-registration-token' } },
          { success: false, error: { code: 'messaging/internal-error' } },
        ],
      }),
    };
    const r = await new FirebaseAdmin(() => messaging).sendToTokens(
      ['a', 'b', 'c', 'd'],
      { title: 'T', body: 'B', url: 'https://u' }
    );
    expect(r).toEqual({ successCount: 1, failureCount: 3, invalidTokens: ['b', 'c'] });
    const msg = messaging.sendEachForMulticast.mock.calls[0][0];
    expect(msg.tokens).toEqual(['a', 'b', 'c', 'd']);
    expect(msg.notification).toEqual({ title: 'T', body: 'B' });
  });
});
