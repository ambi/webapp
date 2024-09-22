import type { Logger } from 'pino';

import { AuthenticationStatus } from '../models/session.js';
import type { PasswordService } from './password.service.js';
import type { UserRepo } from './user.repo.js';

export interface SigninParams {
  userName: string;
  password: string;
}

export interface SigninResult {
  authenticationStatus: AuthenticationStatus;
  userId?: string;
  reason?: string;
}

export class SigninService {
  constructor(
    private pwds: PasswordService,
    private users: UserRepo,
  ) {}

  async signin(logger: Logger, params: SigninParams): Promise<SigninResult> {
    const user = await this.users.findByUserName(params.userName);
    if (!user) {
      logger.warn({ userName: params.userName }, 'signin: user not found');
      return { authenticationStatus: AuthenticationStatus.UNAUTHENTICATED, reason: 'user_not_found' };
    }

    const validPwd = await this.pwds.verify(user.passwordHash, params.password);
    if (!validPwd) {
      logger.warn({ userName: params.userName }, 'signin: invalid password');
      return { authenticationStatus: AuthenticationStatus.UNAUTHENTICATED, reason: 'invalid_password' };
    }

    logger.info({ userName: params.userName }, 'signin: password authentication succeeded');
    return { authenticationStatus: AuthenticationStatus.AUTHENTICATED, userId: user.id };
  }
}
