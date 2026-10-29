/**
 * Envoi direct navigateur → S3 par URL présignée. XMLHttpRequest (et non fetch) pour
 * obtenir la progression ; un AbortSignal permet d'annuler l'envoi.
 */
export default class S3UploadClient {
  constructor(createXhr = () => new XMLHttpRequest()) {
    this.createXhr = createXhr;
  }

  upload(url, file, contentType, { onProgress, signal } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = this.createXhr();
      const fail = (message) => reject(new Error(message));
      xhr.open('PUT', url);
      // Le type fait partie de la signature : il doit être identique à celui demandé.
      xhr.setRequestHeader('Content-Type', contentType);
      if (xhr.upload)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress)
            onProgress(Math.round((e.loaded / e.total) * 100));
        };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : fail(`Envoi refusé par le stockage (HTTP ${xhr.status})`);
      xhr.onerror = () => fail("Échec réseau pendant l'envoi");
      xhr.onabort = () => fail('Envoi annulé');
      if (signal) {
        if (signal.aborted) return fail('Envoi annulé');
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
      }
      xhr.send(file);
    });
  }
}
