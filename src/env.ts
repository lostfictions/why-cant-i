import * as fs from "fs";
import * as envalid from "envalid";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";

export const {
  DATA_DIR,
  MASTODON_TOKEN,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
  SENTRY_DSN,
  isDev,
} = envalid.cleanEnv(
  process.env,
  {
    DATA_DIR: envalid.str({ devDefault: "persist" }),
    MASTODON_TOKEN: envalid.str(),
    TWITTER_API_KEY: envalid.str(),
    TWITTER_API_SECRET: envalid.str(),
    TWITTER_ACCESS_TOKEN: envalid.str(),
    TWITTER_ACCESS_SECRET: envalid.str(),
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

export const MASTODON_SERVER = "https://mastodon.social";
