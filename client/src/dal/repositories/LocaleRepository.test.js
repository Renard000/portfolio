import LocaleRepository from './LocaleRepository.js';

const memory = (initial = {}) => ({
  data: { ...initial },
  getItem(k) {
    return this.data[k] ?? null;
  },
  setItem(k, v) {
    this.data[k] = v;
  },
});

describe('LocaleRepository', () => {
  it('suit la langue du navigateur tant que rien n’est choisi', () => {
    expect(new LocaleRepository(memory(), 'en-US').get()).toBe('en');
    expect(new LocaleRepository(memory(), 'fr-CA').get()).toBe('fr');
    expect(new LocaleRepository(memory(), 'es-ES').get()).toBe('fr');
  });

  it('le choix enregistré prime sur le navigateur', () => {
    const repo = new LocaleRepository(memory(), 'en-US');
    repo.set('fr');
    expect(repo.get()).toBe('fr');
  });

  it('ignore une valeur inconnue et survit à un stockage indisponible', () => {
    expect(new LocaleRepository(memory({ 'locale:v1': 'de' }), 'fr').get()).toBe('fr');
    const broken = {
      getItem() {
        throw new Error('bloqué');
      },
      setItem() {
        throw new Error('bloqué');
      },
    };
    const repo = new LocaleRepository(broken, 'en');
    expect(() => repo.set('fr')).not.toThrow();
    expect(repo.get()).toBe('en');
  });
});
