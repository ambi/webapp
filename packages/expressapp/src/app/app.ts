import flash from 'connect-flash';
import csurf from 'csurf';
import express, { type NextFunction, type Request, type Response } from 'express';
import { engine } from 'express-handlebars';
import session from 'express-session';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import type { Config } from '../config/config.js';
import { HomeController } from '../home/controllers/home.controller.js';
import { HomeService } from '../home/services/home.service.js';
import { SigninController } from '../id/controllers/signin.controller.js';
import { PasswordService } from '../id/services/password.service.js';
import { SigninService } from '../id/services/signin.service.js';
import type { UserRepo } from '../id/services/user.repo.js';

export const defaultConfig: Config = {
  port: 8080,
  sessionSecret: 'secret',
  homePath: '/home',
  signinPath: '/signin',
};

export function createApp(cfg: Config, users: UserRepo) {
  const app = express();

  // Logging.
  // Redact senstive information. Cookie and authorization headers should be hidden.
  const pino = pinoHttp({ redact: ['req.headers.cookie', 'res.headers["set-cookie"]', 'req.headers.authorization'] });
  app.use(pino);

  // Support requests of "application/json".
  app.use(express.json());
  // Support requests of "application/x-www-form-urlencoded"
  app.use(express.urlencoded({ extended: true }));
  // Support requests of "application/octet-stream".
  // app.use(express.raw());
  // Support requests of "multipart/form-data";
  // const multer  = require('multer');
  // const upload = multer();

  // Serve static files.
  // app.use(express.static('public'));

  // Use a session middleware.
  app.use(
    session({
      name: 'expressapp-session',
      secret: cfg.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // maxAge: ...,
        // secure: true, // true in the production environment
        // rolling: ...,
        // store: ...,
      },
    }),
  );
  // Use a flash middleware.
  app.use(flash());

  // Use handlerbars as a template engine.
  app.engine('handlebars', engine());
  app.set('view engine', 'handlebars');

  // Enable CORS.
  // import cors from 'cors';
  // app.use(cors());

  // Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
  // import cookieParser from 'cookie-parser';
  // app.use(cookieParser());

  // DB integration.
  // import { PrismaClient } from '@prisma/client';
  // const prisma = new PrismaClient();

  // Secure HTTP response headers.
  app.use(helmet());
  // Disable X-Powered-By. (helmet disabled it, but we write explicit disabling just in case)
  app.disable('x-powered-by');

  // OpenAPI: TODO.

  const pwdSvc = new PasswordService();
  const signinSvc = new SigninService(pwdSvc, users);
  const homeSvc = new HomeService(users);
  const signinCtr = new SigninController(cfg, signinSvc);
  const homeCtr = new HomeController(cfg, homeSvc);

  app.get(cfg.homePath, homeCtr.home.bind(homeCtr));
  // TODO: csurf has been deprecated, but csurf is a good choice even now.
  const csrfProtection = csurf();
  app.get(cfg.signinPath, csrfProtection, signinCtr.signinPage.bind(signinCtr));
  app.post(cfg.signinPath, csrfProtection, signinCtr.signin.bind(signinCtr));

  app.use((req, res, next) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'server_error' });
  });

  return { app, logger: pino.logger };
}
