import type { AddressInfo } from 'node:net';
import axios, { type CreateAxiosDefaults } from 'axios';
import * as cheerio from 'cheerio';
import setCookie from 'set-cookie-parser';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp, defaultConfig } from '../../src/app/app.js';
import { createTestData } from '../../src/app/test-data.js';
import type { User } from '../../src/id/models/user.js';
import { Users } from '../../src/id/repositories/users.js';

const cfg = defaultConfig;
const users = new Users();
const { app, logger } = createApp(cfg, users);
logger.level = 'silent';
let testData: { users: User[]; userPasswords: string[] };
const axiosCfg: CreateAxiosDefaults = {
  validateStatus: () => true, // Don't throw HTTP exceptions.
  maxRedirects: 0, // No redirects.
};

beforeAll(async () => {
  testData = await createTestData(users);

  const srv = app.listen(); // Use randomized port in tests.
  const address = srv.address() as AddressInfo;
  axiosCfg.baseURL = `http://127.0.0.1:${address.port}`;
});

describe('GET /signin', () => {
  it('returns the signin page', async () => {
    const agent = axios.create(axiosCfg);

    const res = await agent.get('/signin');
    expect(res.status).toBe(200);
    expect(res.data).toMatch('username');
    expect(res.data).toMatch('csrf');
  });
});

describe('GET /home', () => {
  it('redirects to the signin page (unauthenticated)', async () => {
    const agent = axios.create(axiosCfg);

    const res = await agent.get('/home');
    console.log(res.data);
    expect(res.status).toBe(302);
    expect(res.headers.location).toEqual('/signin');
  });

  it('returns the home page (authenticated)', async () => {
    const agent = axios.create(axiosCfg);

    let res = await agent.get('/home');
    expect(res.status).toBe(302);
    let location = res.headers.location;
    expect(location).toEqual('/signin');
    let sCookies = setCookie(res.headers['set-cookie']!);
    let cookies = sCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    res = await agent.get(location, { headers: { Cookie: cookies } });
    expect(res.status).toBe(200);
    const dollar = cheerio.load(res.data);
    const csrfToken = dollar('#signin-csrf').attr('value');

    const params = new URLSearchParams({
      username: testData.users[0].userName,
      password: testData.userPasswords[0],
      _csrf: csrfToken!,
    });
    res = await agent.post(location, params, { headers: { Cookie: cookies } });
    expect(res.status).toBe(302);
    location = res.headers.location;
    expect(location).toEqual('/home');
    sCookies = setCookie(res.headers['set-cookie']!);
    cookies = sCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    res = await agent.get(location, { headers: { Cookie: cookies } });
    expect(res.status).toBe(200);
    expect(res.data).toMatch(`User name: ${testData.users[0].userName}`);
  });
});
