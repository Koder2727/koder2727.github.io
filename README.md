# kunaldamame.dev

Personal website + engineering notes. Minimal, typography-led, dark-by-default,
zero client JS except the theme toggle. Built with [Astro](https://astro.build).

## Stack

- **Astro** — static site generator, ships ~0 JS
- **Markdown / MDX** content collections for notes (`src/content/notes`)
- **Shiki** dual-theme syntax highlighting (switches with the light/dark toggle)
- **RSS** feed + sitemap generated at build time

## Develop

```bash
npm install      # first time only
npm run dev      # http://localhost:4321
```

## Build & preview

```bash
npm run build    # outputs static site to ./dist
npm run preview  # serve the built site locally
```

## Editing content

| What | Where |
| --- | --- |
| Homepage (bio, experience, links, competencies) | `src/consts.ts` |
| Notes / blog posts | `src/content/notes/*.md` |
| Global styles & theme colors | `src/styles/global.css` |
| Site URL, integrations, Shiki themes | `astro.config.mjs` |

### Adding a note

Create a new Markdown file in `src/content/notes/`. The filename becomes the URL
slug. Frontmatter:

```markdown
---
title: "Your title"
date: 2026-06-01
summary: "One-line summary shown in lists and the RSS feed."
tags: ["go", "networking"]
draft: false   # set true to hide from the build
---

Your content in **Markdown**. Fenced code blocks get syntax highlighting.
```

## Deploy

The `dist/` folder is plain static files — host it anywhere (Cloudflare Pages,
Netlify, Vercel, GitHub Pages, S3). Update `site` in `astro.config.mjs` to your
real domain so canonical URLs, the sitemap, and RSS links are correct.
