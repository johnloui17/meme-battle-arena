import { createApp } from "./app";
import { env } from "./config/env";
import { connectDb, pool } from "./lib/db";
import { runMigrations } from "./db/migrate";
import { logger } from "./lib/logger";

async function main() {
  await connectDb();
  await runMigrations(pool);
  createApp().listen(env.PORT, () => logger.info(`back-end listening on :${env.PORT}`));
}

main().catch((error) => {
  logger.error({ error }, "failed to start back-end");
  process.exit(1);
});
