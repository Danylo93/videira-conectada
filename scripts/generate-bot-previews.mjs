import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOT_PREVIEW_USER_AGENT_PATTERN,
  DEFAULT_PAGE_METADATA,
  ROUTE_METADATA,
  SITE_URL,
  getBotPreviewRewrites,
} from "../src/config/route-metadata.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(projectRoot, "public");
const botPreviewDir = path.join(publicDir, "bot-previews");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildHtml(route) {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const image = escapeHtml(route.image);
  const imageType = escapeHtml(route.imageType);
  const twitterCard = escapeHtml(route.twitterCard);
  const url = escapeHtml(`${SITE_URL}${route.canonicalPath}`);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="Videira São Miguel" />

    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="shortcut icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />

    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:url" content="${url}" />

    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body></body>
</html>
`;
}

async function ensureBrandAssets() {
  await copyFile(
    path.join(projectRoot, "src", "assets", "logo-videira.png"),
    path.join(publicDir, "logo-videira.png"),
  );
}

async function writeBotPreviewFiles() {
  await mkdir(botPreviewDir, { recursive: true });

  for (const route of ROUTE_METADATA) {
    await writeFile(path.join(botPreviewDir, `${route.key}.html`), buildHtml(route), "utf8");
  }
}

async function writeVercelConfig() {
  const vercelConfig = {
    rewrites: [
      ...getBotPreviewRewrites().map((rewrite) => ({
        source: rewrite.source,
        has: [
          {
            type: "header",
            key: "user-agent",
            value: BOT_PREVIEW_USER_AGENT_PATTERN,
          },
        ],
        destination: rewrite.destination,
      })),
      {
        source: "/(.*)",
        destination: "/index.html",
      },
    ],
  };

  await writeFile(path.join(projectRoot, "vercel.json"), `${JSON.stringify(vercelConfig, null, 2)}\n`, "utf8");
}

async function writeDefaultPreview() {
  await writeFile(path.join(publicDir, "bot-preview-default.html"), buildHtml(DEFAULT_PAGE_METADATA), "utf8");
}

await ensureBrandAssets();
await writeBotPreviewFiles();
await writeDefaultPreview();
await writeVercelConfig();
