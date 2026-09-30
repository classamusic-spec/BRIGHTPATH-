#!/usr/bin/env node
/**
 * Renders the Talk board pictures.
 *
 * Reads every symbol name used in src/content/talk.ts (plus EXTRA below),
 * renders each one from Fluent Emoji (colour, MIT © Microsoft) to a 192 px
 * palette PNG in assets/talk/, removes pictures nothing uses any more, and
 * writes src/content/talkSymbols.ts.
 *
 *   npm run talk:symbols
 *
 * The renderer (resvg + sharp) and the icon data are pinned below and
 * installed on first run into node_modules/.cache/talk-symbols, so they are
 * not app dependencies. Output is deterministic: unchanged pictures are not
 * rewritten.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'src/content/talk.ts');
const OUT_DIR = path.join(ROOT, 'assets/talk');
const MAP_FILE = path.join(ROOT, 'src/content/talkSymbols.ts');
const TOOLS = path.join(ROOT, 'node_modules/.cache/talk-symbols');
const PACKAGES = { '@resvg/resvg-js': '2.6.2', sharp: '0.35.5', '@iconify-json/fluent-emoji': '1.2.7' };
/** Rendered large, then downsampled for clean edges. */
const RENDER = 576;
/** 64 pt at 3x. */
const SIZE = 192;
/** Symbols the app uses outside talk.ts: the Recent and My words tabs. */
const EXTRA = ['mantelpiece-clock', 'sparkling-heart'];

const LICENSE = `Pictures in this folder are rendered from Fluent Emoji
https://github.com/microsoft/fluentui-emoji

MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

function loadTools() {
  const installed = (name) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(TOOLS, 'node_modules', name, 'package.json'), 'utf8')).version;
    } catch {
      return null;
    }
  };
  if (Object.entries(PACKAGES).some(([name, version]) => installed(name) !== version)) {
    fs.mkdirSync(TOOLS, { recursive: true });
    const manifest = path.join(TOOLS, 'package.json');
    if (!fs.existsSync(manifest)) fs.writeFileSync(manifest, '{ "private": true }\n');
    console.log(`Installing the renderer into ${path.relative(ROOT, TOOLS)} …`);
    // All together, so npm never prunes one it was not asked about.
    const specs = Object.entries(PACKAGES).map(([name, version]) => `${name}@${version}`);
    execFileSync('npm', ['install', '--no-audit', '--no-fund', '--save-exact', ...specs], { cwd: TOOLS, stdio: 'inherit' });
  }
  const req = createRequire(path.join(TOOLS, 'package.json'));
  return {
    Resvg: req('@resvg/resvg-js').Resvg,
    sharp: req('sharp'),
    emoji: JSON.parse(fs.readFileSync(path.join(TOOLS, 'node_modules/@iconify-json/fluent-emoji/icons.json'), 'utf8')),
  };
}

/** Symbol names: 2nd argument of a card helper, 3rd of sub()/cat(). */
function symbolNames() {
  const src = fs.readFileSync(SOURCE, 'utf8');
  const str = String.raw`'(?:[^'\\]|\\.)*'`;
  const patterns = [
    new RegExp(String.raw`\b[padtsqnl]\(\s*${str},\s*'([a-z0-9-]+)'`, 'g'),
    new RegExp(String.raw`\b(?:sub|cat)\(\s*${str},\s*${str},\s*'([a-z0-9-]+)'`, 'g'),
  ];
  const names = new Set(EXTRA);
  for (const re of patterns) for (const m of src.matchAll(re)) names.add(m[1]);
  return [...names].sort();
}

function svgFor(set, name) {
  const alias = set.aliases?.[name];
  const icon = set.icons[name] ?? (alias && set.icons[alias.parent]);
  if (!icon) throw new Error(`"${name}" is not a Fluent Emoji name (used in src/content/talk.ts).`);
  const left = icon.left ?? set.left ?? 0;
  const top = icon.top ?? set.top ?? 0;
  const w = icon.width ?? set.width ?? 16;
  const h = icon.height ?? set.height ?? 16;
  const flip = !set.icons[name] && alias?.hFlip;
  const body = flip ? `<g transform="translate(${2 * left + w} 0) scale(-1 1)">${icon.body}</g>` : icon.body;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${left} ${top} ${w} ${h}">${body}</svg>`;
}

async function main() {
  const names = symbolNames();
  const { Resvg, sharp, emoji } = loadTools();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  let bytes = 0;
  for (const name of names) {
    const large = new Resvg(svgFor(emoji, name), { fitTo: { mode: 'width', value: RENDER } }).render().asPng();
    const png = await sharp(large)
      .resize(SIZE, SIZE, { kernel: 'lanczos3' })
      .png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 })
      .toBuffer();
    const file = path.join(OUT_DIR, `${name}.png`);
    const old = fs.existsSync(file) ? fs.readFileSync(file) : null;
    if (!old || !old.equals(png)) {
      fs.writeFileSync(file, png);
      written++;
    }
    bytes += png.length;
  }

  const keep = new Set(names.map((n) => `${n}.png`));
  const removed = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png') && !keep.has(f));
  for (const f of removed) fs.rmSync(path.join(OUT_DIR, f));
  fs.writeFileSync(path.join(OUT_DIR, 'LICENSE'), LICENSE);

  const rows = names.map((n) => `  '${n}': require('../../assets/talk/${n}.png'),`).join('\n');
  fs.writeFileSync(
    MAP_FILE,
    `// Generated by scripts/build-talk-symbols.mjs from the symbol names in talk.ts. Do not edit.
// Pictures: Fluent Emoji by Microsoft (MIT License), https://github.com/microsoft/fluentui-emoji
import type { ImageSourcePropType } from 'react-native';

export const TALK_SYMBOLS = {
${rows}
} satisfies Record<string, ImageSourcePropType>;

export type SymbolId = keyof typeof TALK_SYMBOLS;
`,
  );

  console.log(
    `${names.length} pictures (${(bytes / 1024 / 1024).toFixed(1)} MB), ${written} written, ${removed.length} removed → ${path.relative(ROOT, OUT_DIR)}/`,
  );
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
