import Video, { SPEEDS, LEVEL_LABELS } from './Video.js';

describe('Video (modèle)', () => {
  it('formatDuration : m:ss et h:mm:ss', () => {
    expect(Video.formatDuration(1590)).toBe('26:30');
    expect(Video.formatDuration(65)).toBe('1:05');
    expect(Video.formatDuration(3725)).toBe('1:02:05');
    expect(Video.formatDuration(0)).toBe('0:00');
    expect(Video.formatDuration(-5)).toBe('0:00');
    expect(Video.formatDuration(undefined)).toBe('0:00');
  });
  it('formatTotal : « 3 h 20 », « 45 min »', () => {
    expect(Video.formatTotal(12000)).toBe('3 h 20');
    expect(Video.formatTotal(2700)).toBe('45 min');
    expect(Video.formatTotal(0)).toBe('0 min');
    expect(Video.formatTotal(7260)).toBe('2 h 01');
  });
  it('parseDuration : mm:ss et h:mm:ss ; formats invalides → null', () => {
    expect(Video.parseDuration('26:30')).toBe(1590);
    expect(Video.parseDuration('1:02:05')).toBe(3725);
    expect(Video.parseDuration(' 0:05 ')).toBe(5);
    for (const bad of [
      '',
      '26',
      'abc',
      '10:75',
      '1:2:3:4',
      '-5:00',
      '12:3x',
      null,
      undefined,
    ])
      expect(Video.parseDuration(bad), String(bad)).toBeNull();
  });
  it("parseDuration est l'inverse de formatDuration", () => {
    for (const s of [1, 59, 60, 61, 3599, 3600, 5400, 86399])
      expect(Video.parseDuration(Video.formatDuration(s))).toBe(s);
  });
  it('chapterIndexAt : dernier chapitre dont t ≤ temps', () => {
    const ch = [
      { t: 0, label: 'a' },
      { t: 60, label: 'b' },
      { t: 300, label: 'c' },
    ];
    expect(Video.chapterIndexAt(ch, 0)).toBe(0);
    expect(Video.chapterIndexAt(ch, 59)).toBe(0);
    expect(Video.chapterIndexAt(ch, 60)).toBe(1);
    expect(Video.chapterIndexAt(ch, 9999)).toBe(2);
    expect(Video.chapterIndexAt([{ t: 30, label: 'x' }], 10)).toBe(-1);
    expect(Video.chapterIndexAt([], 10)).toBe(-1);
    expect(Video.chapterIndexAt(undefined, 10)).toBe(-1);
  });
  it('niveaux et vitesses', () => {
    expect(Video.levelLabel('intermediate')).toBe('Intermédiaire');
    expect(Video.levelLabel('autre')).toBe('autre');
    expect(Object.keys(LEVEL_LABELS)).toHaveLength(3);
    expect(SPEEDS).toEqual([0.75, 1, 1.25, 1.5, 2]);
  });
});
