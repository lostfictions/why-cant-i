import fs from "fs";
import path from "path";
import { withScope } from "@sentry/node";

import { randomInArray } from "../util/index";
import { DATA_DIR } from "../env";
import imageSearch from "./image-search";

let conceptsBag: Set<string>;
try {
  const conceptsFromFile = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "unused-concepts.json")).toString(),
  );
  if (!Array.isArray(conceptsFromFile)) {
    throw new Error("Concepts bag loaded from file is not an array!");
  }
  conceptsBag = new Set(conceptsFromFile);
} catch (e) {
  console.warn(`Cannot load concepts from file!\n[${String(e)}]`);
  refillConceptsBag();
}

function refillConceptsBag(): void {
  console.log("Concepts bag exhausted. Refilling...");
  const concepts = require(path.join(__dirname, "../../data", "concepts"));
  conceptsBag = new Set(concepts);
  fs.writeFileSync(
    path.join(DATA_DIR, "unused-concepts.json"),
    JSON.stringify([...conceptsBag], undefined, 2),
  );
}

function getRandomUnusedConcept(): string {
  const item = randomInArray([...conceptsBag]);
  conceptsBag.delete(item);
  if (conceptsBag.size === 0) {
    refillConceptsBag();
  } else {
    fs.writeFileSync(
      path.join(DATA_DIR, "unused-concepts.json"),
      JSON.stringify([...conceptsBag], undefined, 2),
    );
  }

  return item;
}

export default async function getConceptImageUrls(
  count: number,
): Promise<{ item: string; images: string[] }> {
  let retries = 3;

  while (retries > 0) {
    const item = getRandomUnusedConcept();
    const images = await imageSearch(item, false, count);

    if (images.length >= count) {
      return {
        item,
        images,
      };
    }

    const r = retries;
    withScope((scope) => {
      scope.setExtra("term", item);
      scope.setExtra("image count", images.length);
      scope.setExtra("retries remaining", r);
      console.warn(`Couldn't find enough images while searching!`);
    });

    retries--;

    if (retries > 0) {
      console.log("Retrying after delay, retries remaining:", retries);
      await new Promise((res) => {
        setTimeout(res, 5000);
      });
    }
  }

  throw new Error(`Couldn't retrieve images and maximum retries exceeded`);
}
