import { UnauthorizedError } from '../../domain/errors/index.js';

export default class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async authenticate(jwt) {
    if (!jwt) throw new UnauthorizedError();
    const user = await this.authRepository.getUserFromToken(jwt);
    if (!user) throw new UnauthorizedError('Jeton invalide');
    return user;
  }

  async isAdmin(userId) {
    return (await this.authRepository.getRole(userId)) === 'admin';
  }
}
