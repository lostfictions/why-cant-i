import { join } from "path";
import { tmpdir } from "os";
import { writeFile } from "fs/promises";

import retry from "async-retry";
import { twoot } from "twoot";

import { makeLimeguy } from "./limeguy";
import pluralize from "./util/pluralize";
import { MASTODON_SERVER, MASTODON_TOKEN } from "./env";

async function doToot(): Promise<void> {
  const { canvas, item } = await retry(makeLimeguy, { retries: 5 });
  const caption = `why cant I, hold all these ${pluralize(item)}?`;

  const buffer = canvas.toBuffer("image/png");

  const res = await twoot(
    {
      status: caption,
      media: [{ buffer, caption }],
    },
    {
      type: "mastodon",
      server: MASTODON_SERVER,
      token: MASTODON_TOKEN,
    },
  );

  console.log(res.status.url);
}

const argv = process.argv.slice(2);

if (argv.includes("local")) {
  console.log("Running locally!");
  (async () => {
    const { canvas, item } = await makeLimeguy();
    const buffer = canvas.toBuffer("image/png");

    const caption = `why cant I, hold all these ${pluralize(item)}?`;

    const filename = join(
      tmpdir(),
      `why-cant-i--${new Date().toISOString().replaceAll(/:|\./g, "-")}.png`,
    );

    await writeFile(filename, buffer);

    console.log(`${caption}\nfile://${filename}\n`);
  })().catch((e) => {
    throw e;
  });
} else {
  doToot().catch((e) => {
    throw e;
  });
}
