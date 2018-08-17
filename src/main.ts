require("source-map-support").install(); // tslint:disable-line:no-require-imports

import { scheduleJob } from "node-schedule";

import { makeLimeguy } from "./limeguy";
import { twoot, Configs as TwootConfigs } from "twoot";

import { MASTODON_SERVER, MASTODON_TOKEN, CRON_RULE } from "./env";

const twootConfigs: TwootConfigs = [
  {
    token: MASTODON_TOKEN,
    server: MASTODON_SERVER
  }
];

async function doTwoot(): Promise<void> {
  const { filename, item } = await makeLimeguy();
  try {
    const urls = await twoot(
      twootConfigs,
      `why cant I, hold all these ${pluralize(item)}?`,
      [filename]
    );
    for (const url of urls) {
      console.log(`twooted at '${url}'!`);
    }
  } catch (e) {
    console.error("error while trying to twoot: ", e);
  }
}

const isVowel = (char: string) => /^[aeiou]$/i.test(char);
function pluralize(word: string) {
  if (word.length < 1) return word;
  switch (word[word.length - 1].toLowerCase()) {
    case "s":
    case "h":
    case "x":
      return word + "es";
    case "y":
      return !isVowel(word[word.length - 2])
        ? word.substring(0, word.length - 1) + "ies"
        : word + "s";
    default:
      return word + "s";
  }
}

if (process.argv.slice(2).includes("local")) {
  const localJob = () =>
    makeLimeguy().then(async ({ filename, item }) => {
      console.log(filename);
      console.log(pluralize(item));
      setTimeout(localJob, 5000);
    });

  localJob();
  console.log("Running locally!");
} else {
  // we're running in production mode!
  const job = scheduleJob(CRON_RULE, doTwoot);
  const now = new Date(Date.now()).toUTCString();
  const next = (job.nextInvocation() as any).toDate().toUTCString(); // bad typings
  console.log(`[${now}] Bot is running! Next job scheduled for [${next}]`);
}
