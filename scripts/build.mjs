// Builds dist/: one self-contained index.html (all game modules inlined, in file-name order) + fx.js.
// Usage: npm run build            → production build
//        npm run build -- --debug → also exposes window.__dbg for testing in the browser console
import { readFile, writeFile, readdir, mkdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src'), dist = join(root, 'dist');
const debug = process.argv.includes('--debug');

const files = (await readdir(join(src, 'game'))).filter(f => f.endsWith('.js')).sort();
let code = '';
for (const f of files) code += `\n// ===== ${f} =====\n` + await readFile(join(src, 'game', f), 'utf8');
if (debug) code += '\nwindow.__dbg={G:()=>G,H:()=>H,ST:()=>ST,ev:(s)=>eval(s)};\n';

// syntax check before writing anything
try { new vm.Script(code, { filename: 'game.js' }); }
catch (e) { console.error('✖ Syntax error in game code:\n', e.message); process.exit(1); }

const shell = await readFile(join(src, 'index.html'), 'utf8');
if (!shell.includes('/*CODE*/')) { console.error('✖ src/index.html has no /*CODE*/ placeholder'); process.exit(1); }

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await writeFile(join(dist, 'index.html'), shell.replace('/*CODE*/', () => code));
await copyFile(join(src, 'vendor', 'fx.js'), join(dist, 'fx.js'));
const pub = join(root, 'public');
if (existsSync(pub)) for (const f of await readdir(pub)) await copyFile(join(pub, f), join(dist, f));

console.log(`✔ dist/ built from ${files.length} modules (${(code.length / 1024).toFixed(0)} KB of game code)${debug ? ' [debug]' : ''}`);
