import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Dossier de travail vide : dotenv ne lit alors aucun vrai .env (test hermétique, comme sur l'hébergeur).
const tmp = mkdtempSync(path.join(os.tmpdir(), 'app-cjs-'));
const appCjs = path.join(root, 'server', 'app.cjs');
const read = (p) => readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');

describe("Addendum D — démarrage sur l'hébergeur (app.cjs)", () => {
  it("app.cjs (CommonJS) démarre réellement l'API ES Modules et répond sur /api/health", async () => {
    const PORT = '45873';
    const child = spawn('node', [appCjs], {
      cwd: tmp,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: 'production',
        PORT,
        CLIENT_ORIGIN: 'https://www.exemple.com',
        SUPABASE_URL: 'http://localhost:54321',
        SUPABASE_SERVICE_ROLE_KEY: 'k',
        FIREBASE_PROJECT_ID: 'p',
        FIREBASE_CLIENT_EMAIL: 'e@p',
        FIREBASE_PRIVATE_KEY: 'k',
        EMAIL_API_KEY: 'x',
        EMAIL_FROM: 'a@b.co',
        PUBLIC_API_URL: 'https://api.exemple.com',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    try {
      let body = null;
      for (let i = 0; i < 50 && !body; i++) {
        await new Promise((r) => setTimeout(r, 200));
        try {
          const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
          body = await res.json();
        } catch {
          /* pas encore démarré */
        }
      }
      expect(stderr).toBe('');
      expect(body).toEqual({ status: 'ok' });
    } finally {
      child.kill();
    }
  }, 20000);

  it('app.cjs échoue proprement (code 1, message) si une variable manque', async () => {
    const child = spawn('node', [appCjs], {
      cwd: tmp,
      env: { PATH: process.env.PATH },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    const code = await new Promise((r) => child.on('exit', r));
    expect(code).toBe(1);
    expect(stderr).toMatch(/Variable manquante : CLIENT_ORIGIN/);
  }, 20000);

  it('Express fait confiance au proxy (limitation de fréquence par visiteur, pas par serveur)', () => {
    expect(read('server/src/web/app.js')).toContain("app.set('trust proxy', 1)");
  });
});

describe('Addendum D — .htaccess du client', () => {
  const h = read('client/public/.htaccess');
  it('repli vers index.html pour BrowserRouter (sans lui, /projets/x rafraîchi donne 404)', () => {
    expect(h).toContain('RewriteEngine On');
    expect(h).toContain('RewriteCond %{REQUEST_FILENAME} !-f');
    expect(h).toContain('RewriteCond %{REQUEST_FILENAME} !-d');
    expect(h).toContain('RewriteRule . /index.html [L]');
  });
  it('en-têtes de sécurité', () => {
    expect(h).toContain('X-Content-Type-Options "nosniff"');
    expect(h).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
    expect(h).toContain('X-Frame-Options "DENY"');
  });
  it("cache d'un an pour les fichiers versionnés ; jamais pour index.html ni le service worker", () => {
    expect(h).toMatch(
      /FilesMatch "\\\.\(js\|css\|svg\|woff2\)\$"[\s\S]*max-age=31536000, immutable/
    );
    expect(h).toMatch(
      /FilesMatch "\^\(index\\\.html\|firebase-messaging-sw\\\.js\)\$"[\s\S]*no-cache/
    );
  });
  it('CSP en mode RAPPORT (Report-Only), pas en mode bloquant', () => {
    expect(h).toContain('Content-Security-Policy-Report-Only');
    expect(h).not.toMatch(/Header always set Content-Security-Policy "/);
  });
  it('CSP : vidéo CloudFront (media-src), Supabase, FCM, API ; aucun script externe ; pas de cadre', () => {
    const csp = h.match(/Report-Only "([^"]+)"/)[1];
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*https?:/);
    expect(csp).toMatch(/media-src https:\/\/dxxxxxxxx\.cloudfront\.net/);
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://fcm.googleapis.com');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("font-src 'self'"); // polices auto-hébergées
  });
});

describe('Addendum E — robots.txt', () => {
  const r = read('client/public/robots.txt');
  it('refuse GPTBot, CCBot et Google-Extended, autorise les moteurs de recherche', () => {
    for (const bot of ['GPTBot', 'CCBot', 'Google-Extended'])
      expect(r).toMatch(new RegExp(`User-agent: ${bot}\\nDisallow: /`));
    expect(r).toMatch(/User-agent: \*\nAllow: \//);
  });
});

describe('Addendum D — intégration continue et déploiement', () => {
  const ci = read('.github/workflows/ci.yml');
  it('le travail deploy attend les tests, ne tourne que sur main, avec mode manuel', () => {
    expect(ci).toContain('workflow_dispatch');
    expect(ci).toMatch(/deploy:\n\s+needs: \[server, client\]/);
    expect(ci).toContain("github.ref == 'refs/heads/main'");
    expect(ci).toContain("vars.DEPLOY_ENABLED == 'true'");
  });
  it("les identifiants viennent des secrets GitHub, jamais du dépôt ; empreinte d'hôte fournie", () => {
    for (const s of [
      'DEPLOY_SSH_KEY',
      'DEPLOY_KNOWN_HOSTS',
      'DEPLOY_HOST',
      'DEPLOY_USER',
      'DEPLOY_PATH',
    ])
      expect(ci).toContain(`secrets.${s}`);
    expect(ci).not.toContain('ssh-keyscan');
    expect(ci).not.toMatch(/BEGIN (OPENSSH|RSA) PRIVATE KEY/);
  });
  it('vérifie le build (.htaccess, robots.txt, service worker) et préserve .well-known', () => {
    expect(ci).toContain('dist/.htaccess');
    expect(ci).toContain('dist/robots.txt');
    expect(ci).toContain("--exclude='.well-known'");
  });
  it('le client reçoit ses variables publiques APP_* depuis les variables du dépôt (pas de secret)', () => {
    expect(ci).toContain('APP_API_URL: ${{ vars.APP_API_URL }}');
    expect(ci).not.toMatch(/SERVICE_ROLE|PRIVATE_KEY:/);
  });
});

describe('Hygiène des secrets', () => {
  it('.gitignore exclut .env, les clés de service et les .pem', () => {
    const g = read('.gitignore');
    expect(g).toMatch(/^\.env$/m);
    expect(g).toMatch(/^\.env\.\*$/m);
    expect(g).toContain('!.env.example');
    expect(g).toContain('firebase-service-account*.json');
    expect(g).toMatch(/^\*\.pem$/m);
  });
});
