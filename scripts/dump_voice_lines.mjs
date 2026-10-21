// Prints the voice job list (speaker, profile, text, file) as JSON, straight from voices.ts/storyData.ts.
import {buildSync} from 'esbuild';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(os.tmpdir(), `vnlc_voices_${process.pid}.mjs`);
buildSync({entryPoints: [path.join(root, 'voices.ts')], bundle: true, format: 'esm', platform: 'node', outfile: tmp, logLevel: 'error'});
const m = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);
const seen = new Set();
const jobs = [];
for (const [speaker, text] of m.allVoiceLines()) {
  const url = m.voiceUrl(speaker, text);
  if (seen.has(url)) continue;
  seen.add(url);
  jobs.push({speaker, text, file: path.basename(url), profile: m.VOICE_PROFILES[speaker], hash: m.voiceHash(m.voiceKey(m.VOICE_PROFILES[speaker], text))});
}
process.stdout.write(JSON.stringify(jobs));
