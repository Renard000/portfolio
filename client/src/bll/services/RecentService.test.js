import RecentService from './RecentService.js';

describe('RecentService.latest', () => {
  const items = [
    { id: 'a', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'b', createdAt: '2026-03-01T00:00:00Z' },
    { id: 'c', createdAt: '2026-02-01T00:00:00Z' },
    { id: 'd', createdAt: '2025-01-01T00:00:00Z' },
  ];

  it('les plus récents d’abord, 3 par défaut', () => {
    expect(RecentService.latest(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
  it('exclut ce qui est déjà affiché (par id ou slug)', () => {
    expect(RecentService.latest(items, { exclude: [items[1]] }).map((i) => i.id)).toEqual(
      ['c', 'a', 'd']
    );
    expect(
      RecentService.latest([{ slug: 'x' }, { slug: 'y' }], {
        exclude: [{ slug: 'x' }],
      }).map((i) => i.slug)
    ).toEqual(['y']);
  });
  it('sans date (contenu du fichier local) : garde l’ordre d’origine, en dernier', () => {
    const list = [
      { id: '1' },
      { id: '2', createdAt: '2026-01-01T00:00:00Z' },
      { id: '3' },
    ];
    expect(RecentService.latest(list).map((i) => i.id)).toEqual(['2', '1', '3']);
  });
  it('date personnalisée ; ne modifie pas la liste reçue', () => {
    const list = Object.freeze([
      { id: '1', issueDate: '2020-01-01' },
      { id: '2', issueDate: '2024-01-01' },
    ]);
    expect(
      RecentService.latest(list, { date: (c) => c.issueDate }).map((i) => i.id)
    ).toEqual(['2', '1']);
  });
});
