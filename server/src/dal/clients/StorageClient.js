import {
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Enveloppe du client S3 (créé uniquement dans la composition root).
 * La BLL ne connaît que createUploadUrl, exists et remove.
 */
export default class StorageClient {
  constructor(s3, bucket, presign = getSignedUrl) {
    this.s3 = s3;
    this.bucket = bucket;
    this.presign = presign;
  }

  /** URL présignée d'envoi (PUT) : le type de contenu fait partie de la signature. */
  async createUploadUrl(key, contentType, expiresIn = 900) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });
    return this.presign(this.s3, command, { expiresIn });
  }

  /** Taille réelle en octets si l'objet existe, sinon null (HeadObject). */
  async exists(key) {
    try {
      const out = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return { size: Number(out.ContentLength) };
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  }

  async remove(key) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
