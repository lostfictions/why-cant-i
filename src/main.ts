require("source-map-support").install();
import { createReadStream } from "fs";
import Masto from "masto";
import retry from "async-retry";
import uuid from "uuid/v4";

import { makeLimeguy } from "./limeguy";
import pluralize from "./util/pluralize";

import { MASTODON_SERVER, MASTODON_TOKEN } from "./env";

async function doTwoot(): Promise<void> {
  const { filename, item } = await retry(makeLimeguy, { retries: 5 });

  const description = `why cant I, hold all these ${pluralize(item)}?`;
  const idempotencyKey = uuid();

  const status = await retry(
    async () => {
      const masto = await Masto.login({
        uri: MASTODON_SERVER,
        accessToken: MASTODON_TOKEN
      });

      const { id } = await masto.uploadMediaAttachment({
        file: createReadStream(filename),
        description
      });

      return masto.createStatus(
        {
          status: description,
          visibility: "public",
          media_ids: [id]
        },
        idempotencyKey
      );
    },
    { retries: 5 }
  );

  console.log(description);
  console.log(`${status.created_at} -> ${status.uri}`);
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  makeLimeguy().then(({ filename, item }) =>
    console.log(
      `why cant I, hold all these ${pluralize(item)}?\nfile://${filename}\n`
    )
  );
} else {
  console.log("Running in production!");
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  doTwoot().then(() => process.exit(0));
}
