# Chaz Tools

Personal toolkit hub. Each tool is a single self-contained HTML file, deployed to Netlify on every git push.

## Architecture

- `sites/YYYY-MM-DD-slug/` — active tools, one folder per tool
- `archive/YYYY-MM-DD-slug/` — retired tools, URLs preserved at `/archive/<slug>/`
- `shared/` — optional shared assets (use sparingly; default rule is single-file HTML)
- `_build/gen-index.js` — Node build script, runs at deploy
- `_build/template.html` — landing page template
- `netlify.toml` — Netlify build config

## Add a new tool

1. Create `sites/YYYY-MM-DD-slug/index.html` (self-contained HTML, inline CSS/JS)
2. Create `sites/YYYY-MM-DD-slug/meta.json`:
   ```
   {
     "title": "Tool Name",
     "date": "2026-05-07",
     "summary": "One line of what it does.",
     "tags": ["generator", "prompt"],
     "audience": "self"
   }
   ```
3. `git commit -am "add: tool name" && git push`
4. Netlify rebuilds (~10s), URL `/<slug>/` is live, landing page updates

## Add a tool that links out (external tool)

For a tool that already lives elsewhere (e.g. a separate hosted app), skip `index.html` and point the card straight at it, opening in a new tab:

1. Create `sites/YYYY-MM-DD-slug/meta.json` with `external: true` and a `url`:
   ```
   {
     "title": "Tool Name",
     "date": "2026-05-07",
     "summary": "One line of what it does.",
     "tags": ["external"],
     "audience": "self",
     "external": true,
     "url": "https://example.com"
   }
   ```
2. `git commit -am "add: tool name" && git push`

## Archive a tool

Move the folder from `sites/` to `archive/`. URL still resolves at `/archive/<slug>/`. Landing page no longer lists it.

## Local preview

```
node _build/gen-index.js
npx http-server public
```

Then open http://localhost:8080.

## URL pattern

- Landing: `<site>.netlify.app/`
- Active tool: `<site>.netlify.app/<slug>/` (date prefix stripped from folder name)
- Archived tool: `<site>.netlify.app/archive/<slug>/`

## Conventions

- Folder names: `YYYY-MM-DD-kebab-case-slug`
- Each site folder contains `index.html` + `meta.json`
- meta.json schema: `title`, `date`, `summary`, `tags` (array), `audience`
- Default to single-file HTML; only use `shared/` when an asset is genuinely needed across multiple tools
