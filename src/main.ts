require("source-map-support").install();
import retry from "async-retry";

import { makeLimeguy } from "./limeguy";
import pluralize from "./util/pluralize";
import { doTwoot } from "./twoot";
import {
  MASTODON_SERVER,
  MASTODON_TOKEN,
  TWITTER_ACCESS_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
} from "./env";

async function generateAndTwoot(): Promise<void> {
  const { filename, item } = await retry(makeLimeguy, { retries: 5 });
  const description = `why cant I, hold all these ${pluralize(item)}?`;

  await doTwoot(
    [{ status: description, pathToMedia: filename }],
    [
      { type: "mastodon", server: MASTODON_SERVER, token: MASTODON_TOKEN },
      {
        type: "twitter",
        apiKey: TWITTER_API_KEY,
        apiSecret: TWITTER_API_SECRET,
        accessToken: TWITTER_ACCESS_TOKEN,
        accessSecret: TWITTER_ACCESS_SECRET,
      },
    ]
  );
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  void makeLimeguy().then(({ filename, item }) =>
    console.log(
      `why cant I, hold all these ${pluralize(item)}?\nfile://${filename}\n`
    )
  );
} else {
  console.log("Running in production!");
  void generateAndTwoot().then(() => process.exit(0));
}
