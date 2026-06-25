// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build
export default defineConfig({
  site: "https://koder2727.github.io",
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      // Dual themes; colors are switched via CSS using the data-theme attribute.
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      wrap: false,
    },
  },
});
