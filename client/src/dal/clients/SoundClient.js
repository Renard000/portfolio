const NOTES = [
  { frequency: 880, at: 0 },
  { frequency: 1318.5, at: 0.13 },
];
const NOTE_LENGTH = 0.28;
const VOLUME = 0.12;

/**
 * Petit carillon synthétisé (aucun fichier audio à charger). Les navigateurs bloquent
 * le son tant que le visiteur n'a pas interagi avec la page : on déverrouille au premier geste.
 */
export default class SoundClient {
  constructor(win = window) {
    this.win = win;
    this.context = null;
    if (win.addEventListener)
      win.addEventListener('pointerdown', () => this.#audio(), { once: true });
  }

  #audio() {
    const Context = this.win.AudioContext || this.win.webkitAudioContext;
    if (!Context) return null;
    if (!this.context) this.context = new Context();
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  play() {
    const audio = this.#audio();
    if (!audio || audio.state !== 'running') return;
    for (const { frequency, at } of NOTES) {
      const start = audio.currentTime + at;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(VOLUME, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + NOTE_LENGTH);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + NOTE_LENGTH);
    }
  }
}
