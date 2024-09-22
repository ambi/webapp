export enum AuthenticationStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
}

export interface Session {
  authenticationStatus?: AuthenticationStatus | null;
  userId?: string | null;
  postSignin?: string | null;
  postSigninParams?: any;
}
