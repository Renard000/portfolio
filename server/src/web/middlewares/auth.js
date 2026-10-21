import { ForbiddenError, UnauthorizedError } from '../../domain/errors/index.js';

/** Lit « Authorization: Bearer <jwt> » et vérifie le jeton (401 si invalide). */
export function authMiddleware(authService) {
  return async (req, res, next) => {
    try {
      const header = req.get('Authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();
      req.user = await authService.authenticate(token);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** À placer après authMiddleware : profiles.role = 'admin' sinon 403. */
export function adminOnly(authService) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (!(await authService.isAdmin(req.user.id))) throw new ForbiddenError();
      next();
    } catch (err) {
      next(err);
    }
  };
}
