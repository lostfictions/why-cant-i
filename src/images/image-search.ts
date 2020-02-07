import axios from "axios";
import cheerio from "cheerio";

export default async function imageSearch(
  query: string,
  exact = true,
  minimumCount?: number
): Promise<string[]> {
  const urls = await requestAndParse({ term: query, exact, transparent: true });

  if (minimumCount && exact && urls.length < minimumCount) {
    // if we don't have the minimum desired, append an inexact search
    return [
      ...new Set(
        urls.concat(
          await requestAndParse({
            term: query,
            transparent: true,
            exact: false
          })
        )
      )
    ];
  }
  return urls;
}

export interface ImageSearchOptions {
  term: string;
  animated?: boolean;
  exact?: boolean;
  transparent?: boolean;
}

export async function requestAndParse(options: ImageSearchOptions) {
  const res = await request(options);
  return parse(res.data);
}

export function request({
  term,
  animated,
  exact,
  transparent
}: ImageSearchOptions) {
  const tbs = [transparent && "ic:trans", animated && "itp:animated"]
    .filter(Boolean)
    .join(",");

  return axios.get<string>("https://www.google.com/search", {
    params: {
      q: term,
      tbm: "isch",
      nfpr: exact ? 1 : 0,
      tbs: tbs || undefined
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36"
    }
  });
}

export function parse(html: string) {
  const $ = cheerio.load(html);

  const strategies = [metaJsonStrategy, largestJsonpStrategy];

  for (const s of strategies) {
    const res = s($);
    if (res && res.length > 0) return res;
  }

  return [];
}

export function metaJsonStrategy($: CheerioStatic): string[] | false {
  const metaLinks = $(".rg_meta");

  if (metaLinks.length === 0) return false;

  const urls: string[] = [];
  metaLinks.each((_i, el) => {
    if (el.children.length > 0 && "data" in el.children[0]) {
      const metadata = JSON.parse((el.children[0] as any).data);
      // x-raw-image = when google sometimes embeds the preview!
      if (metadata.ou && !metadata.ou.startsWith("x-raw-image")) {
        urls.push(metadata.ou);
      }
      // Elements without metadata.ou are subcategory headings in the results page.
    }
  });

  return urls;
}

const PREFIX = "data:function(){return ";

export function largestJsonpStrategy($: CheerioStatic): string[] | false {
  const scripts = $("script").toArray();

  let script: string | null = null;
  let longest = Number.NEGATIVE_INFINITY;

  for (const el of scripts) {
    const s = $(el).text();
    if (s.slice(0, 250).includes(PREFIX)) {
      if (s.length > longest) {
        script = s;
        longest = s.length;
      }
    }
  }

  if (script) {
    return [
      ...script.matchAll(/"(https?:\/\/[^"]+\.(?:jpe?g|gifv|png))"/g)
    ].map(res => res[1]);
  }

  return false;
}
