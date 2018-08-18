import axios from "axios";
import * as cheerio from "cheerio";

export default async function imageSearch(
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
