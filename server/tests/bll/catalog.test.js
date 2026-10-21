import { describe, it, expect } from 'vitest';
import CertificationService from '../../src/bll/services/CertificationService.js';
import AwardService from '../../src/bll/services/AwardService.js';
import { NotFoundError } from '../../src/domain/errors/index.js';
import Certification from '../../src/domain/entities/Certification.js';
import Award from '../../src/domain/entities/Award.js';
import { MemoryCrudRepo, makeCert, makeAward } from '../helpers/fakes.js';

describe('CertificationService', () => {
  const build = () => {
    const repo = new MemoryCrudRepo(Certification, [
      makeCert({
        id: 'a',
        title: 'Sécurité Réseau',
        issuer: 'Cisco',
        category: 'Sécurité',
        issueDate: '2022-01-01',
        skills: ['firewall'],
        featured: true,
      }),
      makeCert({
        id: 'b',
        title: 'AWS Developer',
        issuer: 'Amazon',
        category: 'Cloud',
        issueDate: '2024-01-01',
        skills: ['Lambda'],
      }),
      makeCert({
        id: 'c',
        title: 'Scrum Master',
        issuer: 'Scrum.org',
        category: 'Gestion',
        issueDate: '2023-01-01',
        description: 'Agilité',
      }),
    ]);
    return { repo, service: new CertificationService(repo) };
  };
  const ids = (l) => l.map((c) => c.id);

  it("sans filtre : tout, dans l'ordre du repository", async () => {
    expect(ids(await build().service.list())).toEqual(['a', 'b', 'c']);
  });
  it('filtre par émetteur (insensible à la casse)', async () => {
    expect(ids(await build().service.list({ issuer: 'amazon' }))).toEqual(['b']);
  });
  it('filtre par catégorie, accents ignorés', async () => {
    expect(ids(await build().service.list({ category: 'securite' }))).toEqual(['a']);
  });
  it('recherche q dans titre, émetteur, description et compétences', async () => {
    const { service } = build();
    expect(ids(await service.list({ q: 'lambda' }))).toEqual(['b']);
    expect(ids(await service.list({ q: 'agilite' }))).toEqual(['c']);
    expect(ids(await service.list({ q: 'cisco' }))).toEqual(['a']);
    expect(await service.list({ q: 'introuvable' })).toEqual([]);
  });
  it('combine plusieurs filtres (ET)', async () => {
    expect(await build().service.list({ issuer: 'Amazon', category: 'Gestion' })).toEqual(
      []
    );
  });
  it('featured=true ne garde que les certifications en vedette', async () => {
    expect(ids(await build().service.list({ featured: 'true' }))).toEqual(['a']);
  });
  it('tri par date croissante et décroissante', async () => {
    const { service } = build();
    expect(ids(await service.list({ sort: 'date_desc' }))).toEqual(['b', 'c', 'a']);
    expect(ids(await service.list({ sort: 'date_asc' }))).toEqual(['a', 'c', 'b']);
  });
  it('create / update / remove', async () => {
    const { service } = build();
    const c = await service.create({ title: 'N', issuer: 'I', issueDate: '2025-01-01' });
    expect((await service.update(c.id, { title: 'N2' })).title).toBe('N2');
    await service.remove(c.id);
    await expect(service.update(c.id, { title: 'x' })).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(service.remove(c.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('AwardService (totaux dans la BLL)', () => {
  const svc = (items) => new AwardService(new MemoryCrudRepo(Award, items));

  it('trie du plus récent au plus ancien', async () => {
    const { items } = await svc([
      makeAward({ id: '1', awardedAt: '2021-01-01' }),
      makeAward({ id: '2', awardedAt: '2024-01-01' }),
    ]).listWithTotals();
    expect(items.map((i) => i.id)).toEqual(['2', '1']);
  });
  it('compte toutes les distinctions et cumule SEULEMENT les bourses, par devise', async () => {
    const { totals } = await svc([
      makeAward({ amount: 1000, currency: 'CAD' }),
      makeAward({ amount: 500.5, currency: 'CAD' }),
      makeAward({ amount: 300, currency: 'USD' }),
      makeAward({ type: 'merit', amount: 9999, currency: 'CAD' }),
      makeAward({ type: 'honor', amount: null }),
    ]).listWithTotals();
    expect(totals.count).toBe(5);
    expect(totals.scholarshipAmounts).toEqual({ CAD: 1500.5, USD: 300 });
  });
  it('évite les erreurs de virgule flottante (0,1 + 0,2)', () => {
    const t = AwardService.computeTotals([
      makeAward({ amount: 0.1 }),
      makeAward({ amount: 0.2 }),
    ]);
    expect(t.scholarshipAmounts.CAD).toBe(0.3);
  });
  it('aucune distinction : totaux à zéro', async () => {
    expect((await svc([]).listWithTotals()).totals).toEqual({
      count: 0,
      scholarshipAmounts: {},
    });
  });
  it('update / remove inconnus : NotFoundError', async () => {
    await expect(svc([]).update('x', { title: 'y' })).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(svc([]).remove('x')).rejects.toBeInstanceOf(NotFoundError);
  });
});
