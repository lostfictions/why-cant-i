import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

import * as Jimp from "jimp";

import { randomInArray, randomInt } from "./util/index";
import { DATA_DIR } from "./env";

const imgDir = path.join(DATA_DIR, "categories");
const limeguyPath = path.join(DATA_DIR, "limeguy.jpg");
const outDir = tmpdir();

let categories: string[] = [];
if (!fs.existsSync(imgDir)) {
  throw new Error(`Image source source directory '${imgDir}' not found!`);
} else {
  categories = fs.readdirSync(imgDir);
  if (categories.length === 0) {
    throw new Error(`No folders in image directory '${imgDir}'!`);
  }
}

async function getRandomImages(
  count: number
): Promise<{ item: string; images: Jimp[] }> {
  const folderName = randomInArray(categories);
  const item = folderName.replace(/_/g, " ");

  const fns = fs.readdirSync(path.join(imgDir, folderName));

  const images = [];
  while (count > 0) {
    const filename = randomInArray(fns);
    fns.splice(fns.indexOf(filename), 1);
    images.push(await Jimp.read(path.join(imgDir, folderName, filename)));
    count--;
  }

  return {
    item,
    images
  };
}

let filenameIndex = 0;

let originalLimeguy: Jimp;

export async function makeLimeguy(): Promise<{
  filename: string;
  item: string;
}> {
  if (!originalLimeguy) originalLimeguy = await Jimp.read(limeguyPath);

  const limeguy = originalLimeguy.clone();

  const { item, images } = await getRandomImages(2);

  limeguy.composite(
    images[0],
    832 - images[0].bitmap.width / 2,
    1440 - images[0].bitmap.height / 2
  );
  limeguy.composite(
    images[1],
    476 - images[1].bitmap.width / 2,
    1848 - images[1].bitmap.height / 2
  );

  filenameIndex += 1;
  const filename = path.join(outDir, `whycanti_${filenameIndex}.jpg`);

  return new Promise<{ filename: string; item: string }>((res, rej) => {
    limeguy.write(filename, e => {
      if (e) {
        rej(e);
      } else {
        res({ filename, item });
      }
    });
  });
}
