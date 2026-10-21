import CertificationRepository from './CertificationRepository.js';
import AwardRepository from './AwardRepository.js';
import NewsletterRepository from './NewsletterRepository.js';
import SubscriberAdminRepository from './SubscriberAdminRepository.js';

const api = () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() });

describe("repositories (chemins de l'API)", () => {
  it('certifications', () => {
    const a = api();
    const r = new CertificationRepository(a);
    r.list({ q: 'x' });
    r.create({ t: 1 });
    r.update('i d', { t: 2 });
    r.remove('9');
    expect(a.get).toHaveBeenCalledWith('/certifications', { q: 'x' });
    expect(a.post).toHaveBeenCalledWith('/certifications', { t: 1 });
    expect(a.put).toHaveBeenCalledWith('/certifications/i%20d', { t: 2 });
    expect(a.delete).toHaveBeenCalledWith('/certifications/9');
  });
  it('distinctions', () => {
    const a = api();
    const r = new AwardRepository(a);
    r.list();
    r.create({});
    r.update('1', {});
    r.remove('1');
    expect(a.get).toHaveBeenCalledWith('/awards');
    expect(a.post).toHaveBeenCalledWith('/awards', {});
    expect(a.put).toHaveBeenCalledWith('/awards/1', {});
    expect(a.delete).toHaveBeenCalledWith('/awards/1');
  });
  it('newsletter et push', () => {
    const a = api();
    const r = new NewsletterRepository(a);
    r.subscribe({ email: 'a@b.co' });
    r.subscribePush('tok');
    expect(a.post).toHaveBeenCalledWith('/newsletter/subscribe', { email: 'a@b.co' });
    expect(a.post).toHaveBeenCalledWith('/push/subscribe', { token: 'tok' });
  });
  it('admin abonnés', () => {
    const a = api();
    const r = new SubscriberAdminRepository(a);
    r.list();
    r.removeNewsletter('n');
    r.removePush('p');
    r.sendTestEmail('x@y.co');
    expect(a.get).toHaveBeenCalledWith('/admin/subscribers');
    expect(a.delete).toHaveBeenCalledWith('/admin/subscribers/newsletter/n');
    expect(a.delete).toHaveBeenCalledWith('/admin/subscribers/push/p');
    expect(a.post).toHaveBeenCalledWith('/admin/newsletter/test-email', { to: 'x@y.co' });
  });
});
