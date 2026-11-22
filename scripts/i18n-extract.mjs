// Scans src/game/*.js and src/index.html for Russian text in string literals / templates / markup
// and merges it into locales/strings.json  ({ "<русская фраза>": { en, uk } }).
// Existing translations are kept; new phrases get empty en/uk; phrases no longer in code are moved to "_unused".
// Usage: npm run i18n:extract   (needs devDependencies: acorn, acorn-walk)
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CYR = 'А-Яа-яЁёІіЇїЄєҐґ';
// a phrase: starts and ends on a Cyrillic letter (or closing quote/punctuation), may contain spaces, digits, punctuation
const RUN = new RegExp(`[${CYR}][${CYR}0-9 ,.:;!?«»()\\-–—/%+×·…'’"]*[${CYR}.!?»)…]|[${CYR}]`, 'g');
const HAS = new RegExp(`[${CYR}]`);
export function phrasesOf(text) {
  const out = [];
  for (const piece of String(text).split(/<[^>]*>|&[a-z]+;|\$\{[^}]*\}/)) {
    for (const m of piece.matchAll(RUN)) { const p = m[0].trim().replace(/[\s,:;·\-–—]+$/, ''); if (p && HAS.test(p) && !/^А-Я/.test(p)) out.push(p); }
  }
  return out;
}
const found = new Map(); // phrase -> Set(files)
const add = (p, f) => { if (!found.has(p)) found.set(p, new Set()); found.get(p).add(f); };

const dir = join(root, 'src', 'game');
for (const f of (await readdir(dir)).filter(f => f.endsWith('.js')).sort()) {
  const code = await readFile(join(dir, f), 'utf8');
  let ast; try { ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); }
  catch (e) { console.error(`parse error in ${f}: ${e.message}`); process.exit(1); }
  walk.full(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string') phrasesOf(n.value).forEach(p => add(p, f));
    if (n.type === 'TemplateElement') phrasesOf(n.value.cooked ?? n.value.raw).forEach(p => add(p, f));
  });
}
const html = (await readFile(join(root, 'src', 'index.html'), 'utf8')).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
phrasesOf(html).forEach(p => add(p, 'index.html'));

const file = join(root, 'locales', 'strings.json');
const old = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : {};
const out = { _meta: { source: 'ru', languages: ['en', 'ru', 'uk'], note: 'Ключ — русская фраза из кода. Заполняйте en и uk. Пустое значение = показывать оригинал.' } };
const keys = [...found.keys()].sort((a, b) => a.localeCompare(b, 'ru'));
for (const k of keys) { const o = old[k] || (old._unused || {})[k] || {}; out[k] = { en: o.en || '', uk: o.uk || '', src: [...found.get(k)].join(' ') }; }
const unused = {}; for (const k of Object.keys(old)) if (k !== '_meta' && k !== '_unused' && !found.has(k)) unused[k] = old[k];
for (const [k, v] of Object.entries(old._unused || {})) if (!found.has(k)) unused[k] = v;
if (Object.keys(unused).length) out._unused = unused;
await writeFile(file, JSON.stringify(out, null, 1) + '\n');
const todo = keys.filter(k => !out[k].en || !out[k].uk).length;
console.log(`✔ ${keys.length} phrases (${keys.reduce((s, k) => s + k.length, 0)} chars), untranslated: ${todo}, unused kept: ${Object.keys(unused).length}`);
