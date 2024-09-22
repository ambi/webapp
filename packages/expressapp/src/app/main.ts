import { add } from 'common';

import { Users } from '../id/repositories/users.js';
import { createApp, defaultConfig } from './app.js';
import { createTestData } from './test-data.js';

async function main() {
  console.log(add(2, 4));

  const cfg = defaultConfig;
  const users = new Users();
  const { app, logger } = createApp(cfg, users);

  await createTestData(users);

  app.listen(cfg.port, () => {
    logger.info(`Example app listening on port ${cfg.port}`);
  });
}

main().catch(console.error);
