import S3UploadClient from './S3UploadClient.js';

describe('S3UploadClient (XMLHttpRequest)', () => {
  const fakeXhr = () => {
    const x = {
      headers: {},
      upload: {},
      open: vi.fn(),
      setRequestHeader(k, v) {
        x.headers[k] = v;
      },
      send: vi.fn(),
      abort: vi.fn(() => x.onabort()),
    };
    return x;
  };
  it('PUT avec le Content-Type signé, progression en %, succès sur 2xx', async () => {
    const x = fakeXhr();
    const onProgress = vi.fn();
    const p = new S3UploadClient(() => x).upload(
      'https://s3/put',
      'FICHIER',
      'video/mp4',
      { onProgress }
    );
    expect(x.open).toHaveBeenCalledWith('PUT', 'https://s3/put');
    expect(x.headers['Content-Type']).toBe('video/mp4');
    expect(x.send).toHaveBeenCalledWith('FICHIER');
    x.upload.onprogress({ lengthComputable: true, loaded: 25, total: 100 });
    x.upload.onprogress({ lengthComputable: false, loaded: 1, total: 0 });
    x.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
    x.status = 200;
    x.onload();
    await expect(p).resolves.toBeUndefined();
    expect(onProgress.mock.calls.map((c) => c[0])).toEqual([25, 100]);
  });
  it('erreur HTTP (ex. 403 : URL expirée) et erreur réseau → rejet avec message clair', async () => {
    const x = fakeXhr();
    const p = new S3UploadClient(() => x).upload('u', 'f', 'video/mp4');
    x.status = 403;
    x.onload();
    await expect(p).rejects.toThrow(/HTTP 403/);
    const y = fakeXhr();
    const q = new S3UploadClient(() => y).upload('u', 'f', 'video/mp4');
    y.onerror();
    await expect(q).rejects.toThrow(/réseau/);
  });
  it("AbortSignal : annule la requête en cours ; signal déjà annulé → rien n'est envoyé", async () => {
    const x = fakeXhr();
    const ctrl = new AbortController();
    const p = new S3UploadClient(() => x).upload('u', 'f', 'video/mp4', {
      signal: ctrl.signal,
    });
    ctrl.abort();
    await expect(p).rejects.toThrow(/annulé/);
    expect(x.abort).toHaveBeenCalled();
    const y = fakeXhr();
    const done = ctrl.signal;
    await expect(
      new S3UploadClient(() => y).upload('u', 'f', 'video/mp4', { signal: done })
    ).rejects.toThrow(/annulé/);
    expect(y.send).not.toHaveBeenCalled();
  });
});
