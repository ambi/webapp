import type { Request } from 'express';

import type { AuthenticationStatus, Session } from '../models/session.js';

declare module 'express-session' {
  interface SessionData {
    authentication_result: AuthenticationStatus | null;
    user_id: string | null;
    post_signin: string | null;
    post_signin_params: any;
  }
}

export function getSession(req: Request): Session {
  return {
    authenticationStatus: req.session.authentication_result,
    userId: req.session.user_id,
    postSignin: req.session.post_signin,
  };
}

export async function saveSession(req: Request, session: Session) {
  if (session.authenticationStatus !== undefined) {
    req.session.authentication_result = session.authenticationStatus;
  }
  if (session.userId !== undefined) {
    req.session.user_id = session.userId;
  }
  if (session.postSignin !== undefined) {
    req.session.post_signin = session.postSignin;
  }

  return new Promise<Error | undefined>((resolve, reject) => {
    req.session.save(resolve);
  });
}

export async function resetSession(req: Request) {
  return new Promise<Error | undefined>((resolve, reject) => {
    req.session.regenerate(resolve);
  });
}
