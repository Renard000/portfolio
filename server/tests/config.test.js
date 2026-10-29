import { describe, it, expect, beforeAll } from 'vitest';

describe("config (variables d'environnement)", () => {
  let config;
  beforeAll(async () => {
    Object.assign(process.env, {
      CLIENT_ORIGIN: 'https://www.ex.com,http://localhost:9000',
      SUPABASE_URL: 'http://x',
      SUPABASE_SERVICE_ROLE_KEY: 'k',
      FIREBASE_PROJECT_ID: 'p',
      FIREBASE_CLIENT_EMAIL: 'e',
      FIREBASE_PRIVATE_KEY: 'a\\nb',
      CLOUDFRONT_PRIVATE_KEY:
        '-----BEGIN RSA PRIVATE KEY-----\\nABC\\n-----END RSA PRIVATE KEY-----',
      CLOUDFRONT_URL: 'https://d1.cloudfront.net',
      MAX_VIDEO_BYTES: '1000',
    });
    ({ config } = await import('../src/shared/config.js'));
  });
  it('convertit les \\n littéraux des clés privées (Firebase et CloudFront) en vrais retours à la ligne', () => {
    expect(config.firebase.privateKey).toBe('a\nb');
    expect(config.cloudfront.privateKey).toBe(
      '-----BEGIN RSA PRIVATE KEY-----\nABC\n-----END RSA PRIVATE KEY-----'
    );
  });
  it('vidéos : valeurs lues, région par défaut Montréal, taille maximale configurable', () => {
    expect(config.cloudfront.url).toBe('https://d1.cloudfront.net');
    expect(config.aws.region).toBe('ca-central-1');
    expect(config.maxVideoBytes).toBe(1000);
  });
  it('siteUrl = première origine autorisée', () => {
    expect(config.siteUrl).toBe('https://www.ex.com');
  });
});
