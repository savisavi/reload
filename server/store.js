// Tiny JSON-file store: accounts + sessions in db.json, one file per save.
// Put DATA_DIR on a persistent disk (Railway Volume) or everything resets on redeploy.
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { writeFile, rename, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function createStore(dir) {
  mkdirSync(join(dir, 'saves'), { recursive: true });
  const dbFile = join(dir, 'db.json');
  let db = { users: {}, sessions: {} };
  if (existsSync(dbFile)) {
    try { db = { users: {}, sessions: {}, ...JSON.parse(readFileSync(dbFile, 'utf8')) }; }
    catch (e) { console.error('db.json is unreadable, starting empty:', e.message); }
  }
  let timer = null, writing = Promise.resolve();
  const atomic = async (file, text) => { const tmp = file + '.tmp'; await writeFile(tmp, text); await rename(tmp, file); };
  const flush = () => { writing = writing.then(() => atomic(dbFile, JSON.stringify(db))).catch(e => console.error('save db failed:', e.message)); return writing; };
  const persist = () => { clearTimeout(timer); timer = setTimeout(flush, 300); };
  return {
    db, persist, flush,
    async readSave(id) { const f = join(dir, 'saves', id + '.json'); if (!existsSync(f)) return null; try { return JSON.parse(await readFile(f, 'utf8')); } catch { return null; } },
    async writeSave(id, data) { await atomic(join(dir, 'saves', id + '.json'), JSON.stringify({ data, t: Date.now() })); },
  };
}
