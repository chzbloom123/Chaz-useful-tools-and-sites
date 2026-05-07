#!/usr/bin/env node
/**
 * Chaz Tools — landing page generator.
 * Walks sites/ and archive/, copies content into public/ at clean URL paths
 * (date prefix stripped), and generates public/index.html from template.html
 * using each site's meta.json as input.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITES_DIR = path.join(ROOT, 'sites');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const SHARED_DIR = path.join(ROOT, 'shared');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TEMPLATE_PATH = path.join(ROOT, '_build', 'template.html');

// Strip YYYY-MM-DD- prefix from folder name to get clean URL slug
function extractSlug(folderName) {
  return folderName.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

// Recursive directory copy (Node 16+ has fs.cpSync but we're keeping deps minimal)
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

console.log('[gen-index] starting build');

// Reset public/
fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Process active sites
const activeSites = [];
if (fs.existsSync(SITES_DIR)) {
  for (const folder of fs.readdirSync(SITES_DIR).sort()) {
    const folderPath = path.join(SITES_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const slug = extractSlug(folder);
    copyDir(folderPath, path.join(PUBLIC_DIR, slug));

    const metaPath = path.join(folderPath, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        activeSites.push({ ...meta, slug });
      } catch (e) {
        console.warn(`[gen-index] could not parse ${metaPath}: ${e.message}`);
      }
    } else {
      console.warn(`[gen-index] no meta.json in ${folder} — site copied but not listed`);
    }
  }
}

// Process archived sites (preserved at /archive/<slug>/, not listed on landing)
let archiveCount = 0;
if (fs.existsSync(ARCHIVE_DIR)) {
  for (const folder of fs.readdirSync(ARCHIVE_DIR)) {
    const folderPath = path.join(ARCHIVE_DIR, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const slug = extractSlug(folder);
    copyDir(folderPath, path.join(PUBLIC_DIR, 'archive', slug));
    archiveCount++;
  }
}

// Copy shared/ if it has anything in it
if (fs.existsSync(SHARED_DIR)) {
  const sharedEntries = fs.readdirSync(SHARED_DIR).filter(f => f !== '.gitkeep');
  if (sharedEntries.length > 0) {
    copyDir(SHARED_DIR, path.join(PUBLIC_DIR, 'shared'));
  }
}

// Sort active sites by date descending (newest first)
activeSites.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

// Build HTML for tool cards (or empty state)
let toolsHtml;
if (activeSites.length === 0) {
  toolsHtml = '<div class="empty">no tools yet · drop a folder in sites/ to begin</div>';
} else {
  toolsHtml = activeSites.map(site => {
    const tags = (site.tags || [])
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join(' ');
    return `<a href="/${escapeHtml(site.slug)}/" class="tool-card">
  <h2>${escapeHtml(site.title || site.slug)}</h2>
  <p class="tool-summary">${escapeHtml(site.summary || '')}</p>
  <div class="tool-meta">
    ${site.date ? `<span>${escapeHtml(site.date)}</span>` : ''}
    ${tags}
  </div>
</a>`;
  }).join('\n');
}

// Render template
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const buildDate = new Date().toISOString().split('T')[0];

const indexHtml = template
  .replace('{{TOOL_COUNT}}', activeSites.length.toString())
  .replace('{{TOOLS}}', toolsHtml)
  .replace('{{BUILD_DATE}}', buildDate);

fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);

console.log(`[gen-index] built: ${activeSites.length} active, ${archiveCount} archived`);
