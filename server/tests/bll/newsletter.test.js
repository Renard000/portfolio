import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewsletterService from '../../src/bll/services/NewsletterService.js';
import { NotFoundError } from '../../src/domain/errors/index.js';
import { MemoryNewsletterRepo } from '../helpers/fakes.js';

let repo, email, service;
const NOW = new Date('2026-03-01T10:00:00Z');
beforeEach(() => {
  repo = new MemoryNewsletterRepo();
  email = { send: vi.fn().mockResolvedValue(undefined) };
  service = new NewsletterService(repo, email, {
    publicApiUrl: 'https://api.ex.com/',
    clock: () => NOW,
  });
});

describe('NewsletterService — double opt-in', () => {
  it('inscription : crée une ligne NON confirmée et envoie le courriel de confirmation', async () => {
    const r = await service.subscribe({ email: 'Ada@Ex.com' });
    expect(r).toEqual({ status: 'pending' });
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].email).toBe('ada@ex.com');
    expect(repo.items[0].confirmedAt).toBeNull();
    const mail = email.send.mock.calls[0][0];
    expect(mail.to).toBe('ada@ex.com');
    expect(mail.html).toContain(
      `https://api.ex.com/api/newsletter/confirm?token=${repo.items[0].confirmToken}`
    );
  });

  it("le lien de confirmation utilise le jeton, jamais l'id ni le courriel", async () => {
    await service.subscribe({ email: 'a@b.co' });
    const { html } = email.send.mock.calls[0][0];
    expect(html).not.toContain(repo.items[0].id);
    expect(html).not.toContain('token=a@b.co');
  });

  it('honeypot rempli : aucune écriture, aucun envoi, même réponse', async () => {
    const r = await service.subscribe({ email: 'bot@x.com', website: 'http://spam' });
    expect(r).toEqual({ status: 'pending' });
    expect(repo.items).toHaveLength(0);
    expect(email.send).not.toHaveBeenCalled();
  });

  it('déjà inscrit et confirmé : même réponse, aucun courriel (pas de fuite)', async () => {
    await service.subscribe({ email: 'a@b.co' });
    await service.confirm(repo.items[0].confirmToken);
    email.send.mockClear();
    expect(await service.subscribe({ email: 'A@B.co' })).toEqual({ status: 'pending' });
    expect(email.send).not.toHaveBeenCalled();
    expect(repo.items).toHaveLength(1);
  });

  it('inscrit mais non confirmé : renvoie le courriel sans doublon', async () => {
    await service.subscribe({ email: 'a@b.co' });
    await service.subscribe({ email: 'a@b.co' });
    expect(repo.items).toHaveLength(1);
    expect(email.send).toHaveBeenCalledTimes(2);
  });

  it('confirmation : confirmed_at renseigné, idempotente', async () => {
    await service.subscribe({ email: 'a@b.co' });
    const s = repo.items[0];
    await service.confirm(s.confirmToken);
    expect(s.confirmedAt).toBe(NOW.toISOString());
    expect(s.canReceive()).toBe(true);
    await service.confirm(s.confirmToken);
    expect(s.confirmedAt).toBe(NOW.toISOString());
  });

  it('jeton de confirmation inconnu : NotFoundError', async () => {
    await expect(service.confirm('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('désinscription : active=false + unsubscribed_at, sans connexion, idempotente', async () => {
    await service.subscribe({ email: 'a@b.co' });
    const s = repo.items[0];
    await service.confirm(s.confirmToken);
    await service.unsubscribe(s.unsubscribeToken);
    expect(s.active).toBe(false);
    expect(s.unsubscribedAt).toBe(NOW.toISOString());
    expect(s.canReceive()).toBe(false);
    await service.unsubscribe(s.unsubscribeToken);
    expect(s.unsubscribedAt).toBe(NOW.toISOString());
  });

  it('le jeton de confirmation ne peut PAS désinscrire (et inversement)', async () => {
    await service.subscribe({ email: 'a@b.co' });
    const s = repo.items[0];
    await expect(service.unsubscribe(s.confirmToken)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(service.confirm(s.unsubscribeToken)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('ré-inscription après désinscription : nouvelle confirmation exigée, nouveau jeton', async () => {
    await service.subscribe({ email: 'a@b.co' });
    const s = repo.items[0];
    await service.confirm(s.confirmToken);
    await service.unsubscribe(s.unsubscribeToken);
    const oldToken = s.confirmToken;
    email.send.mockClear();
    await service.subscribe({ email: 'a@b.co' });
    expect(s.confirmedAt).toBeNull();
    expect(s.canReceive()).toBe(false);
    expect(s.confirmToken).not.toBe(oldToken);
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('courriel de test', async () => {
    await service.sendTest('admin@x.com');
    expect(email.send.mock.calls[0][0].to).toBe('admin@x.com');
  });
});
