import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../consts";

export async function GET(context) {
  const notes = (await getCollection("notes"))
    .filter((n) => !n.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: `${SITE.author} — Notes`,
    description: SITE.description,
    site: context.site,
    items: notes.map((n) => ({
      title: n.data.title,
      description: n.data.summary ?? "",
      pubDate: n.data.date,
      link: `/notes/${n.id}/`,
    })),
  });
}
