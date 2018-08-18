import * as fs from "fs";
import * as envalid from "envalid";

const env = envalid.cleanEnv(
  process.env,
  {
    DATA_DIR: envalid.str({ default: "persist" }),
    MASTODON_SERVER: envalid.url({ default: "https://mastodon.social" }),
    MASTODON_TOKEN: envalid.str(),
    CRON_RULE: envalid.str({ default: "0 3,7,11,15,19,23 * * *" })
  },
  { strict: true }
);

export const { DATA_DIR, MASTODON_SERVER, MASTODON_TOKEN, CRON_RULE } = env;

if (!fs.existsSync(DATA_DIR)) {
  throw new Error(`Data directory '${DATA_DIR}' doesn't exist!`);
}
