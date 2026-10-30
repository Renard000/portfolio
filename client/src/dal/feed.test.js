import SeenRepository from './repositories/SeenRepository.js';
import SoundClient from './clients/SoundClient.js';

describe('Mémoire du visiteur et son', () => {
  const seen = { items: {}, sections: {}, muted: false };

  it('SeenRepository : stockage illisible ou indisponible sans erreur', () => {
    const broken = {
      getItem: () => {
        throw new Error('privé');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const repo = new SeenRepository(broken);
    expect(repo.load()).toEqual(seen);
    expect(() => repo.save(seen)).not.toThrow();
    expect(new SeenRepository({ getItem: () => '{oups' }).load()).toEqual(seen);
  });

  it('SoundClient : muet sans Web Audio ou tant que le navigateur le bloque', () => {
    expect(() => new SoundClient({}).play()).not.toThrow();
    const resume = vi.fn();
    class Blocked {
      state = 'suspended';
      resume = resume;
      createOscillator = vi.fn();
    }
    const sound = new SoundClient({ AudioContext: Blocked });
    sound.play();
    expect(resume).toHaveBeenCalled();
    expect(sound.context.createOscillator).not.toHaveBeenCalled();
  });
});
