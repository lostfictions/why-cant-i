require("source-map-support").install(); // tslint:disable-line:no-require-imports

import { scheduleJob } from "node-schedule";

import { makeHeathcliff } from "./heath";
import { twoot, Configs as TwootConfigs } from "twoot";
import { randomInArray } from "./util";

import {
  MASTODON_SERVER,
  MASTODON_TOKEN,
  isValidMastodonConfiguration,
  TWITTER_CONSUMER_KEY as consumerKey,
  TWITTER_CONSUMER_SECRET as consumerSecret,
  TWITTER_ACCESS_KEY as accessKey,
  TWITTER_ACCESS_SECRET as accessSecret,
  isValidTwitterConfiguration,
  CRON_RULE
} from "./env";

const twootConfigs: TwootConfigs = [];
if (isValidMastodonConfiguration) {
  twootConfigs.push({
    token: MASTODON_TOKEN,
    server: MASTODON_SERVER
  });
}
if (isValidTwitterConfiguration) {
  twootConfigs.push({
    consumerKey,
    consumerSecret,
    accessKey,
    accessSecret
  });
}

const messages = [
  `Today's Heathcliff:`,
  `Heathcliff comic for today:`,
  `It's Heathcliff!`,
  `Here's Heathcliff!`
];

async function makeTwoot(): Promise<{ filename: string; status: string }> {
  return {
    filename: await makeHeathcliff(),
    status: randomInArray(messages)
  };
}

async function doTwoot(): Promise<void> {
  const { filename, status } = await makeTwoot();
  try {
    const urls = await twoot(twootConfigs, status, [filename]);
    for (const url of urls) {
      console.log(`twooted at '${url}'!`);
    }
  } catch (e) {
    console.error("error while trying to twoot: ", e);
  }
}

let job;
if (process.argv.slice(2).includes("local")) {
  const localJob = () =>
    makeTwoot().then(({ filename, status }) =>
      console.log(`${status} ${filename}`)
    );
  localJob();
  job = scheduleJob("*/10 * * * * *", localJob);
} else {
  // we're running in production mode!
  job = scheduleJob(CRON_RULE, doTwoot);
}

const now = new Date(Date.now()).toUTCString();
const next = (job.nextInvocation() as any).toDate().toUTCString(); // bad typings
console.log(`[${now}] Bot is running! Next job scheduled for [${next}]`);
