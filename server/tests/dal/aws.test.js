import { describe, it, expect, vi } from 'vitest';
import StorageClient from '../../src/dal/clients/StorageClient.js';
import CdnSigner, { UnconfiguredStorage } from '../../src/dal/clients/CdnSigner.js';
import VideoRepository from '../../src/dal/repositories/VideoRepository.js';
import VideoSeriesRepository from '../../src/dal/repositories/VideoSeriesRepository.js';
import { ServiceUnavailableError } from '../../src/domain/errors/index.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

describe('StorageClient', () => {
  it('createUploadUrl : commande PUT avec bucket, clé, type et cache long ; expiration transmise', async () => {
    const presign = vi.fn().mockResolvedValue('https://signed');
    const s3 = {};
    const url = await new StorageClient(s3, 'mon-bucket', presign).createUploadUrl(
      'videos/s/01-a.mp4',
      'video/mp4',
      900
    );
    expect(url).toBe('https://signed');
    const [client, command, opts] = presign.mock.calls[0];
    expect(client).toBe(s3);
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: 'mon-bucket',
      Key: 'videos/s/01-a.mp4',
      ContentType: 'video/mp4',
    });
    expect(command.input.CacheControl).toContain('immutable');
    expect(opts).toEqual({ expiresIn: 900 });
  });
  it('exists : taille réelle, null si 404/NotFound, relance les autres erreurs', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ContentLength: 1234 })
      .mockRejectedValueOnce(Object.assign(new Error('x'), { name: 'NotFound' }))
      .mockRejectedValueOnce(
        Object.assign(new Error('x'), { $metadata: { httpStatusCode: 404 } })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error('Accès refusé'), { name: 'AccessDenied' })
      );
    const c = new StorageClient({ send }, 'b');
    expect(await c.exists('k')).toEqual({ size: 1234 });
    expect(await c.exists('k')).toBeNull();
    expect(await c.exists('k')).toBeNull();
    await expect(c.exists('k')).rejects.toThrow('Accès refusé');
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'b', Key: 'k' });
  });
  it('remove : DeleteObject sur le bon objet', async () => {
    const send = vi.fn().mockResolvedValue({});
    await new StorageClient({ send }, 'b').remove('videos/a.mp4');
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: 'b', Key: 'videos/a.mp4' });
  });
});

describe('CdnSigner', () => {
  it("signe l'URL CloudFront (base + clé) avec identifiant de clé, clé privée et expiration ISO", () => {
    const signFn = vi.fn().mockReturnValue('https://signed');
    const exp = new Date('2026-05-01T12:00:00Z');
    const out = new CdnSigner('KPID', 'PEM', 'https://d1.cloudfront.net/', signFn).sign(
      'videos/s/01-a.mp4',
      exp
    );
    expect(out).toBe('https://signed');
    expect(signFn).toHaveBeenCalledWith({
      url: 'https://d1.cloudfront.net/videos/s/01-a.mp4',
      keyPairId: 'KPID',
      privateKey: 'PEM',
      dateLessThan: '2026-05-01T12:00:00.000Z',
    });
  });
  it('produit une vraie URL signée avec une vraie clé RSA (Expires, Signature, Key-Pair-Id)', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const url = new CdnSigner('KPID123', privateKey, 'https://d1.cloudfront.net').sign(
      'videos/s/01-a.mp4',
      new Date(Date.now() + 3600_000)
    );
    const u = new URL(url);
    expect(u.pathname).toBe('/videos/s/01-a.mp4');
    expect(u.searchParams.get('Key-Pair-Id')).toBe('KPID123');
    expect(u.searchParams.get('Signature')).toBeTruthy();
    expect(u.searchParams.get('Expires')).toBeTruthy();
  });
  it('UnconfiguredStorage : toute opération échoue avec ServiceUnavailableError (503)', () => {
    const fail = () => {
      throw new ServiceUnavailableError('Service vidéo non configuré');
    };
    const u = new UnconfiguredStorage(fail);
    for (const m of ['createUploadUrl', 'exists', 'remove', 'sign'])
      expect(() => u[m]()).toThrow(ServiceUnavailableError);
  });
});

function fakeSupabase(result) {
  const calls = [];
  const b = new Proxy(
    {},
    {
      get(_, p) {
        if (p === 'then') return (res, rej) => Promise.resolve(result).then(res, rej);
        return (...a) => (calls.push([p, ...a]), b);
      },
    }
  );
  return {
    from: (t) => (calls.push(['from', t]), b),
    rpc: (...a) => (calls.push(['rpc', ...a]), b),
    calls,
  };
}
const vRow = {
  id: 'v1',
  series_id: 's1',
  title: 'T',
  slug: 't',
  video_key: 'videos/s/01-t.mp4',
  poster_key: null,
  size_bytes: '512000000',
  duration_seconds: 600,
  position: 1,
  chapters: [{ t: 0, label: 'a' }],
  resources: [],
  status: 'published',
  views: 3,
};

describe('Repositories vidéo', () => {
  it('VideoRepository : mappe les colonnes, taille bigint → nombre', async () => {
    const v = await new VideoRepository(
      fakeSupabase({ data: vRow, error: null })
    ).findById('v1');
    expect(v).toMatchObject({
      seriesId: 's1',
      videoKey: 'videos/s/01-t.mp4',
      durationSeconds: 600,
      sizeBytes: 512000000,
    });
  });
  it("create n'écrit que les colonnes connues (pas d'id, de views ni de colonne inventée)", async () => {
    const sb = fakeSupabase({ data: vRow, error: null });
    await new VideoRepository(sb).create({
      seriesId: 's1',
      title: 'T',
      slug: 't',
      videoKey: 'videos/s/01-t.mp4',
      durationSeconds: 600,
      views: 999,
      id: 'x',
      hack: 1,
    });
    expect(sb.calls.find((c) => c[0] === 'insert')[1]).toEqual({
      series_id: 's1',
      title: 'T',
      slug: 't',
      video_key: 'videos/s/01-t.mp4',
      duration_seconds: 600,
    });
  });
  it('incrementViews et reorder passent par les fonctions SQL (RPC)', async () => {
    const sb = fakeSupabase({ data: null, error: null });
    const r = new VideoRepository(sb);
    await r.incrementViews('v1');
    await r.reorder('s1', ['b', 'a']);
    expect(sb.calls.filter((c) => c[0] === 'rpc')).toEqual([
      ['rpc', 'increment_video_views', { p_video_id: 'v1' }],
      ['rpc', 'reorder_videos', { p_series_id: 's1', p_video_ids: ['b', 'a'] }],
    ]);
  });
  it('nextPosition : max + 1, ou 1 si la série est vide', async () => {
    expect(
      await new VideoRepository(
        fakeSupabase({ data: [{ position: 4 }], error: null })
      ).nextPosition('s')
    ).toBe(5);
    expect(
      await new VideoRepository(fakeSupabase({ data: [], error: null })).nextPosition('s')
    ).toBe(1);
  });
  it('VideoSeriesRepository : séries + vidéos imbriquées, brouillons exclus par défaut', async () => {
    const sb = fakeSupabase({
      data: [
        {
          id: 's1',
          title: 'S',
          slug: 's',
          status: 'published',
          level: 'beginner',
          sort_order: 0,
          videos: [vRow],
        },
      ],
      error: null,
    });
    const [s] = await new VideoSeriesRepository(sb).list();
    expect(s.videos[0].slug).toBe('t');
    expect(sb.calls).toContainEqual(['eq', 'status', 'published']);
    const sb2 = fakeSupabase({ data: [], error: null });
    await new VideoSeriesRepository(sb2).list({ includeDrafts: true });
    expect(sb2.calls.find((c) => c[0] === 'eq')).toBeUndefined();
  });
  it('erreur Supabase → exception', async () => {
    await expect(
      new VideoRepository(
        fakeSupabase({ data: null, error: { message: 'boom' } })
      ).findById('x')
    ).rejects.toThrow('boom');
  });
});
