import axios from "axios";
import { load, type CheerioAPI } from "cheerio";

export default async function imageSearch(
  query: string,
  exact = true,
  minimumCount?: number,
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
            exact: false,
          }),
        ),
      ),
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
  transparent,
}: ImageSearchOptions) {
  const tbs = [transparent && "ic:trans", animated && "itp:animated"]
    .filter(Boolean)
    .join(",");

  return axios.get<string>("https://www.google.com/search", {
    params: {
      q: term,
      tbm: "isch",
      nfpr: exact ? 1 : 0,
      tbs: tbs || undefined,
    },
    timeout: 5000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36",
    },
  });
}

export function parse(html: string) {
  const $ = load(html);

  const strategies = [genericScriptPayloadStrategy, allJsonpStrategy];

  for (const s of strategies) {
    const res = s($);
    if (res && res.length > 0) return res;
  }

  return [];
}

// identical to older `allJsonpStrategy` below, but without filtering
export function genericScriptPayloadStrategy($: CheerioAPI): string[] | false {
  const scripts = $("script")
    .toArray()
    .map((el) => $(el).text());

  if (scripts.length > 0) {
    return scripts
      .flatMap((script) => [
        ...script.matchAll(/"(https?:\/\/[^"]+\.(?:jpe?g|gifv?|png))"/g),
      ])
      .map((res) =>
        // google image search results sometimes contain code points encoded as
        // eg. \u003d, so replace them with their actual values
        res[1].replaceAll(/\\u([a-fA-F0-9]{4})/gi, (_, g) =>
          String.fromCodePoint(parseInt(g, 16)),
        ),
      );
  }

  return false;
}

const PREFIX = "AF_initDataCallback";
export function allJsonpStrategy($: CheerioAPI): string[] | false {
  const scripts = $("script")
    .toArray()
    .map((el) => $(el).text())
    .filter((t) => t.startsWith(PREFIX));

  if (scripts.length > 0) {
    return scripts
      .flatMap((script) => [
        ...script.matchAll(/"(https?:\/\/[^"]+\.(?:jpe?g|gifv?|png))"/g),
      ])
      .map((res) =>
        // google image search results sometimes contain code points encoded as
        // eg. \u003d, so replace them with their actual values
        res[1].replaceAll(/\\u([a-fA-F0-9]{4})/gi, (_, g) =>
          String.fromCodePoint(parseInt(g, 16)),
        ),
      );
  }

  return false;
}
