export class ValidationError extends Error {
  constructor(message = 'Données invalides', details = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
export class NotFoundError extends Error {
  constructor(message = 'Introuvable') {
    super(message);
    this.name = 'NotFoundError';
  }
}
export class UnauthorizedError extends Error {
  constructor(message = 'Authentification requise') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
export class ForbiddenError extends Error {
  constructor(message = 'Accès refusé') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
