import type { Logger } from 'pino';

import type { User } from '../../id/models/user.js';
import type { UserRepo } from '../../id/services/user.repo.js';

export interface HomeParams {
  userId: string;
}

export interface HomeResult {
  user: User;
}

export class HomeService {
  constructor(private users: UserRepo) {}

  async home(logger: Logger, params: HomeParams): Promise<HomeResult> {
    const user = await this.users.get(params.userId);
    if (!user) throw new Error('user not found');

    return { user };
  }
}
