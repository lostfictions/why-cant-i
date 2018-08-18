import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { tmpdir } from "os";

import axios from "axios";
import * as cheerio from "cheerio";

import { randomInArray } from "./util/index";
import pluralize from "./util/pluralize";

import { DATA_DIR } from "./env";

const {
  createCanvas,
  loadImage,
  registerFont,
  Image
}: {
  createCanvas(
    width: number,
    height: number
  ): HTMLCanvasElement & {
    createPNGStream(): Readable;
  };
  loadImage(path: string): Promise<ImageBitmap>;
  registerFont(
    path: string,
    props: { family: string; weight?: string | number; style?: string }
  ): void;
  Image: {
    new (width?: number, height?: number): HTMLImageElement;
  };
} = require("canvas");

const staticDataDir = path.join(__dirname, "../data");
const limeguyPath = path.join(staticDataDir, "limeguy.jpg");
const concepts = require(path.join(staticDataDir, "concepts"));

registerFont(path.join(staticDataDir, "impact.ttf"), { family: "Impact" });

const outDir = tmpdir();

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

async function getRandomImages(
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

async function imageSearch(
  query: string,
  exact = true,
  minimumCount?: number
): Promise<string[]> {
  const res = await axios.get("https://google.com/search", {
    params: {
      q: query,
      tbm: "isch", // perform an image search
      nfpr: exact ? 1 : 0, // exact search, don't correct typos
      tbs: "ic:trans"
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36"
    }
  });

  const $ = cheerio.load(res.data);
  const metaLinks = $(".rg_meta");
  const urls: string[] = [];
  metaLinks.each((_i, el) => {
    if (el.children.length > 0 && "data" in el.children[0]) {
      const metadata = JSON.parse((el.children[0] as any).data);
      if (metadata.ou) {
        urls.push(metadata.ou);
      }
      // Elements without metadata.ou are subcategory headings in the results page.
    }
  });

  if (minimumCount != null && exact && urls.length < minimumCount) {
    // if we don't have the minimum desired, append an inexact search
    return [...new Set(urls.concat(await imageSearch(query, false)))];
  }
  return urls;
}

let filenameIndex = 0;

let originalLimeguy: ImageBitmap;

const maxHeight = 800;

// pixel coords, unscaled. order matters! roughly background-to-foreground
const limeCoords = [
  [856, 1336],
  [700, 1324],
  [456, 1568],
  [436, 1312],
  [588, 1264],
  [468, 1856],
  [828, 1440]
];
// also unscaled!
const limeSize = 140;

async function loadRemoteImage(src: string): Promise<HTMLImageElement> {
  const resp = await axios.get(src, { responseType: "arraybuffer" });
  const buff = Buffer.from(resp.data);
  const image = new Image();
  const imageLoad = new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
  });
  image.src = buff as any;

  await imageLoad;
  return image;
}

export async function makeLimeguy(): Promise<{
  filename: string;
  item: string;
}> {
  if (!originalLimeguy) {
    originalLimeguy = await loadImage(limeguyPath);
  }

  const canvasAspect = originalLimeguy.width / originalLimeguy.height;

  const canvas = createCanvas(maxHeight * canvasAspect, maxHeight);
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(originalLimeguy, 0, 0, maxHeight * canvasAspect, maxHeight);

  const scale = maxHeight / originalLimeguy.height;

  const adjustedCoords = limeCoords.map(([x, y]) => [x * scale, y * scale]);
  const size = limeSize * scale;

  const { item, images } = await getRandomImages(limeCoords.length);

  let imgIndex = 0;
  for (const [limeX, limeY] of adjustedCoords) {
    let didDraw = false;
    while (!didDraw && imgIndex < images.length) {
      try {
        const image = await loadRemoteImage(images[imgIndex]);
        const aspect = image.width / image.height;
        ctx.drawImage(
          image,
          limeX - (size * aspect) / 2,
          limeY - size / 2,
          size * aspect,
          size
        );
        didDraw = true;
      } catch (e) {
        console.error(`can't load url: ${images[imgIndex]}:\n[${e}]\n`);
      }
      imgIndex++;
    }
  }

  ctx.font = "80px Impact";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const topText = `why cant I,`;
  ctx.fillText(topText, canvas.width / 2, 5);
  ctx.strokeText(topText, canvas.width / 2, 5);

  const bottomText = `hold all these ${pluralize(item)}?`;
  ctx.font = "50px Impact";
  ctx.textBaseline = "bottom";

  if (ctx.measureText(bottomText).width > canvas.width) {
    console.log("shrank");
    ctx.lineWidth = 1;
    ctx.font = "30px Impact";
  }

  ctx.fillText(
    bottomText,
    canvas.width / 2,
    canvas.height - 10,
    canvas.width - 20
  );
  ctx.strokeText(
    bottomText,
    canvas.width / 2,
    canvas.height - 10,
    canvas.width - 20
  );

  filenameIndex += 1;
  const filename = path.join(outDir, `whycanti_${filenameIndex}.png`);

  const pngStream = canvas.createPNGStream();
  const outStream = fs.createWriteStream(filename);
  pngStream.pipe(outStream);

  return new Promise<{ filename: string; item: string }>((res, rej) => {
    outStream.on("finish", () => res({ filename, item }));
    outStream.on("error", e => rej(e));
  });
}
