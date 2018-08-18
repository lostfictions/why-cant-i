import * as fs from "fs";
import * as path from "path";

import { randomInArray } from "../util/index";
import { DATA_DIR } from "../env";
import imageSearch from "./image-search";

const concepts = require(path.join(__dirname, "../../data", "concepts"));

let conceptsBag: Set<string>;
try {
  const conceptsFromFile = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "unused-concepts.json")).toString()
  );
  if (!Array.isArray(conceptsFromFile)) {
    throw new Error("Concepts bag loaded from file is not an array!");
  }
  conceptsBag = new Set(conceptsFromFile);
} catch (e) {
  console.warn(`Cannot load concepts from file!\n[${e}]`);
  refillConceptsBag();
}

function refillConceptsBag(): void {
  console.log("Concepts bag exhausted. Refilling...");
  conceptsBag = new Set(concepts);
  fs.writeFileSync(
    path.join(DATA_DIR, "unused-concepts.json"),
    JSON.stringify([...conceptsBag], undefined, 2)
  );
}

export default async function getConceptImageUrls(
  count: number
): Promise<{ item: string; images: string[] }> {
  const item = randomInArray([...conceptsBag]);
  conceptsBag.delete(item);
  if (conceptsBag.size === 0) {
    refillConceptsBag();
  } else {
    fs.writeFileSync(
      path.join(DATA_DIR, "unused-concepts.json"),
      JSON.stringify([...conceptsBag], undefined, 2)
    );
  }

  const images = await imageSearch(item, false, count);

  if (images.length < count) {
    console.warn(`Couldn't find enough images when searching for "${item}"!`);
  }

  return {
    item,
    images
  };
}
