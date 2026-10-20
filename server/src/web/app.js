import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export function createApp(container, config) {
  const app = express();
  app.set('trust proxy', 1); // derrière le proxy de l'hébergeur (RapidNet)

  app.use(helmet());
  // CLIENT_ORIGIN accepte plusieurs adresses séparées par des virgules
  const origins = config.clientOrigin.split(',').map((o) => o.trim());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  // app.use('/api/articles', buildArticleRoutes(container.articleController));

  // 404 puis gestionnaire d'erreurs (toujours en dernier)
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  if (container.errorHandler) {
    app.use(container.errorHandler);
  }
  return app;
}