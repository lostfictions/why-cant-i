import { Image } from "canvas";
import axios from "axios";

export default async function loadRemoteImage(src: string): Promise<Image> {
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
