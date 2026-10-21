import { ValidationError } from '../../domain/errors/index.js';

/**
 * validate({ body, params, query }) : valide avec Zod et range le résultat dans
 * req.validated (en Express 5, req.query est en lecture seule).
 */
export function validate(schemas) {
  return (req, res, next) => {
    req.validated = req.validated || {};
    for (const source of ['body', 'params', 'query']) {
      if (!schemas[source]) continue;
      const result = schemas[source].safeParse(req[source] ?? {});
      if (!result.success) {
        return next(
          new ValidationError(
            'Données invalides',
            result.error.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            }))
          )
        );
      }
      req.validated[source] = result.data;
    }
    next();
  };
}
