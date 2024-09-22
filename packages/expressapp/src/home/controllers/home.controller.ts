import type { Request, Response } from 'express';

import type { Config } from '../../config/config.js';
import { getSession, saveSession } from '../../id/controllers/session.js';
import { AuthenticationStatus } from '../../id/models/session.js';
import type { HomeService } from '../services/home.service.js';

export class HomeController {
  constructor(
    private cfg: Config,
    private homeSvc: HomeService,
  ) {}

  async home(req: Request, res: Response) {
    const session = getSession(req);
    if (session.authenticationStatus !== AuthenticationStatus.AUTHENTICATED || !session.userId) {
      await saveSession(req, {
        postSignin: this.cfg.homePath,
      });
      res.redirect(this.cfg.signinPath);
      return;
    }

    const params = { userId: session.userId };
    const result = await this.homeSvc.home(req.log, params);

    res.status(200).render('../src/home/views/home', { user: result.user });
  }
}
