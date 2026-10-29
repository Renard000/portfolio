import {
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/errors/index.js';

/** Convertit les erreurs en réponses JSON, sans jamais divulguer de détails internes. */
export function createErrorHandler(logger = console) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (err instanceof ValidationError)
      return res.status(400).json({ error: err.message, details: err.details });
    if (err instanceof UnauthorizedError)
      return res.status(401).json({ error: err.message });
    if (err instanceof ForbiddenError)
      return res.status(403).json({ error: err.message });
    if (err instanceof ServiceUnavailableError)
      return res.status(503).json({ error: err.message });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    // Erreurs du parseur JSON (corps mal formé, trop gros)
    if (err && err.status >= 400 && err.status < 500)
      return res.status(err.status).json({ error: 'Requête invalide' });
    logger.error(err);
    return res.status(500).json({ error: 'Erreur interne' });
  };
}
