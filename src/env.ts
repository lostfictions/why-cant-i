import * as fs from "fs";
import * as envalid from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";

export const {
  DATA_DIR,
  MASTODON_SERVER,
  MASTODON_TOKEN,
  SENTRY_DSN,
  isDev,
} = envalid.cleanEnv(
  process.env,
  {
    DATA_DIR: envalid.str({ default: "persist" }),
    MASTODON_SERVER: envalid.url({ default: "https://mastodon.social" }),
    MASTODON_TOKEN: envalid.str(),
    SENTRY_DSN: envalid.str({ default: "" }),
  },
  { strict: true }
);

if (!fs.existsSync(DATA_DIR)) {
  throw new Error(`Data directory '${DATA_DIR}' doesn't exist!`);
}

if (SENTRY_DSN.length === 0) {
  console.warn(
    `Sentry DSN is invalid! Error reporting to sentry will be disabled.`
  );
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: isDev ? "dev" : "prod",
    integrations: [
      new CaptureConsole({ levels: ["warn", "error", "debug", "assert"] }),
    ],
  });
}
