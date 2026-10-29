import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

/** Signe les URL CloudFront (key group). Reçoit tout par le constructeur. */
export default class CdnSigner {
  constructor(keyPairId, privateKey, baseUrl, signFn = getSignedUrl) {
    this.keyPairId = keyPairId;
    this.privateKey = privateKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.signFn = signFn;
  }

  /** @param path chemin relatif (la clé S3) ; @param expiresAt Date d'expiration */
  sign(path, expiresAt) {
    return this.signFn({
      url: `${this.baseUrl}/${path}`,
      keyPairId: this.keyPairId,
      privateKey: this.privateKey,
      dateLessThan: expiresAt.toISOString(),
    });
  }
}

/** Remplaçants quand AWS n'est pas configuré : toute utilisation renvoie 503. */
export class UnconfiguredStorage {
  constructor(fail) {
    this.fail = fail;
  }
  createUploadUrl() {
    return this.fail();
  }
  exists() {
    return this.fail();
  }
  remove() {
    return this.fail();
  }
  sign() {
    return this.fail();
  }
}
