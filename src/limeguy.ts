import * as fs from "fs";
import * as path from "path";
import { tmpdir } from "os";

import { createCanvas, loadImage, registerFont } from "canvas";

import pluralize from "./util/pluralize";
import getConceptImageUrls from "./images/get-concept-image-urls";
import loadRemoteImage from "./images/load-remote-image";

const staticDataDir = path.join(__dirname, "../data");
registerFont(path.join(staticDataDir, "impact.ttf"), { family: "Impact" });

const outDir = tmpdir();

let filenameIndex = 0;

let originalLimeguy: ImageBitmap;
let midgroundLimeguy: ImageBitmap;
let foregroundLimeguy: ImageBitmap;

const maxHeight = 800;

export async function makeLimeguy(): Promise<{
  filename: string;
  item: string;
}> {
  if (!originalLimeguy) {
    originalLimeguy = await loadImage(path.join(staticDataDir, "limeguy.jpg"));
    midgroundLimeguy = await loadImage(
      path.join(staticDataDir, "limeguy_midground.png")
    );
    foregroundLimeguy = await loadImage(
      path.join(staticDataDir, "limeguy_foreground.png")
    );
  }

  const scale = maxHeight / originalLimeguy.height;

  // pixel coords, unscaled. order matters! roughly background-to-foreground
  const backgroundLimes = [
    [856, 1336],
    [700, 1324],
    [436, 1312],
    [588, 1264]
  ].map(([x, y]) => [x * scale, y * scale]);
  // prettier-ignore
  const midgroundLimes = [
    [456, 1568]
  ].map(([x, y]) => [x * scale, y * scale]);
  // prettier-ignore
  const foregroundLimes = [
    [468, 1856],
    [828, 1440]
  ].map(([x, y]) => [x * scale, y * scale]);

  const size = 250 * scale;

  const canvasAspect = originalLimeguy.width / originalLimeguy.height;
  const canvas = createCanvas(maxHeight * canvasAspect, maxHeight);
  const ctx = canvas.getContext("2d")!;

  const { item, images } = await getConceptImageUrls(backgroundLimes.length);

  let imgIndex = 0;
  ctx.drawImage(originalLimeguy, 0, 0, maxHeight * canvasAspect, maxHeight);
  await drawImages(backgroundLimes);
  ctx.drawImage(midgroundLimeguy, 0, 0, maxHeight * canvasAspect, maxHeight);
  await drawImages(midgroundLimes);
  ctx.drawImage(foregroundLimeguy, 0, 0, maxHeight * canvasAspect, maxHeight);
  await drawImages(foregroundLimes);

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

  // shrink the font size if we're too wide.
  // we add a few characters of padding to try to compensate for node-canvas'
  // buggy discrepancies between fillText and strokeText.
  // note that shrinking the text may not be necessary in the first place with a
  // real canvas -- the latter has a "maxWidth" parameter when drawing text, but
  // it's broken in node-canvas.
  if (ctx.measureText(bottomText + "xx").width > canvas.width) {
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

  async function drawImages(coordSet: number[][]) {
    for (const [limeX, limeY] of coordSet) {
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
          // We don't care about (most) failures. Just retry with another URL.
          // Checking for real, persistent errors is I guess TODO.
          // console.warn(`can't load url: ${images[imgIndex]}:\n[${e}]\n`);
        }
        imgIndex++;
      }
    }
  }
}
