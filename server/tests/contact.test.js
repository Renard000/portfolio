import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/web/app.js';
import ContactService from '../src/bll/services/ContactService.js';
import ContactController from '../src/web/controllers/ContactController.js';
import ContactRepository from '../src/dal/repositories/ContactRepository.js';
import { MemoryContactRepo } from './helpers/fakes.js';

const valid = {
  nom: 'Ada Lovelace',
  email: 'Ada@Ex.com',
  sujet: 'Mandat',
  message: 'Bonjour, parlons de votre projet.',
};
let repo, email, logger, app;

beforeEach(() => {
  repo = new MemoryContactRepo();
  email = { send: vi.fn().mockResolvedValue(undefined) };
  logger = { error: vi.fn(), log: vi.fn() };
  const service = new ContactService(repo, email, { notifyTo: 'moi@ex.com', logger });
  app = createApp(
    {
      contactController: new ContactController(service),
      authService: {},
      certificationController: {},
      awardController: {},
      newsletterController: {},
      subscriberAdminController: {},
    },
    { clientOrigin: 'http://localhost:9000' }
  );
});

describe('POST /api/contact', () => {
  it('enregistre le message (courriel normalisé) et répond 201', async () => {
    const res = await request(app).post('/api/contact').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ status: 'received' });
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0]).toMatchObject({
      nom: 'Ada Lovelace',
      email: 'ada@ex.com',
      sujet: 'Mandat',
      lu: false,
    });
  });
  it('envoie une copie au propriétaire, contenu HTML échappé', async () => {
    await request(app)
      .post('/api/contact')
      .send({
        ...valid,
        nom: '<script>x</script>',
        message: '<img src=x onerror=alert(1)> bonjour',
      });
    expect(email.send).toHaveBeenCalledTimes(1);
    const mail = email.send.mock.calls[0][0];
    expect(mail.to).toBe('moi@ex.com');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<img');
    expect(mail.html).toContain('&lt;script&gt;');
  });
  it('une panne de courriel ne fait pas échouer la demande (message déjà enregistré)', async () => {
    email.send.mockRejectedValue(new Error('smtp down'));
    const res = await request(app).post('/api/contact').send(valid);
    expect(res.status).toBe(201);
    expect(repo.items).toHaveLength(1);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.error.mock.calls[0][0]).not.toContain('Bonjour'); // pas de contenu dans les journaux
  });
  it('sans adresse de notification : aucun courriel', async () => {
    const service = new ContactService(repo, email, { notifyTo: '', logger });
    await service.send(valid);
    expect(email.send).not.toHaveBeenCalled();
    expect(repo.items).toHaveLength(1);
  });
  it('honeypot rempli : réponse identique, rien d’écrit ni d’envoyé', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...valid, website: 'http://spam' });
    expect(res.status).toBe(201);
    expect(repo.items).toHaveLength(0);
    expect(email.send).not.toHaveBeenCalled();
  });
  it.each([
    ['sans nom', { nom: '  ' }],
    ['courriel invalide', { email: 'pas-un-courriel' }],
    ['message trop court', { message: 'court' }],
    ['message trop long', { message: 'x'.repeat(5001) }],
    ['nom trop long', { nom: 'x'.repeat(101) }],
  ])('refuse (%s) avec 400, rien d’écrit', async (_n, patch) => {
    const res = await request(app)
      .post('/api/contact')
      .send({ ...valid, ...patch });
    expect(res.status).toBe(400);
    expect(repo.items).toHaveLength(0);
  });
  it('champs inconnus ignorés (pas d’injection de colonne)', async () => {
    await request(app)
      .post('/api/contact')
      .send({ ...valid, lu: true, id: 'forge' });
    expect(repo.items[0].lu).toBe(false);
    expect(repo.items[0].id).not.toBe('forge');
  });
  it('limitation de fréquence : le 6e message est refusé (429)', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await request(app).post('/api/contact').send(valid)).status);
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
  });
});

describe('ContactRepository', () => {
  it('insère dans la table messages, sujet vide → null, lève si Supabase échoue', async () => {
    const calls = [];
    const builder = new Proxy(
      {},
      {
        get: (_, p) =>
          p === 'then'
            ? undefined
            : (...a) => (
                calls.push([p, ...a]),
                p === 'single'
                  ? Promise.resolve({ data: { id: 1 }, error: null })
                  : builder
              ),
      }
    );
    await new ContactRepository({
      from: (t) => (calls.push(['from', t]), builder),
    }).create({ nom: 'A', email: 'a@b.co', sujet: '', message: 'bonjour bonjour' });
    expect(calls.find((c) => c[0] === 'from')[1]).toBe('messages');
    expect(calls.find((c) => c[0] === 'insert')[1]).toEqual({
      nom: 'A',
      email: 'a@b.co',
      sujet: null,
      message: 'bonjour bonjour',
    });
    const failing = new Proxy(
      {},
      {
        get: (_, p) =>
          p === 'single'
            ? () => Promise.resolve({ data: null, error: { message: 'boom' } })
            : () => failing,
      }
    );
    await expect(
      new ContactRepository({ from: () => failing }).create({
        nom: 'A',
        email: 'a@b.co',
        message: 'x',
      })
    ).rejects.toThrow('boom');
  });
});
