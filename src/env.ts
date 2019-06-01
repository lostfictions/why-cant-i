import * as fs from "fs";
import * as envalid from "envalid";

export const { DATA_DIR, MASTODON_SERVER, MASTODON_TOKEN } = envalid.cleanEnv(
  process.env,
  {
    DATA_DIR: envalid.str({ default: "persist" }),
    MASTODON_SERVER: envalid.url({ default: "https://mastodon.social" }),
    MASTODON_TOKEN: envalid.str()
  },
  { strict: true }
);

if (!fs.existsSync(DATA_DIR)) {
  throw new Error(`Data directory '${DATA_DIR}' doesn't exist!`);
}
