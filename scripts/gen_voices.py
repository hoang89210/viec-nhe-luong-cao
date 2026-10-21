#!/usr/bin/env python3
"""Regenerate Telesales voice clips into assets/voice/.

Requires: `pip install edge-tts` and ffmpeg on PATH, plus node (reads the line
list from voices.ts / storyData.ts via scripts/dump_voice_lines.mjs).

    python3 scripts/gen_voices.py            # generate missing clips, delete orphans
    python3 scripts/gen_voices.py --force    # regenerate everything

File names are <speaker>_<fnv1a32("voice|pitch|rate|fx|text")>.mp3, computed the
same way in voices.ts, so editing a line or a voice profile just yields a new
file. The phone-line effect is baked in with ffmpeg (mono, low bitrate).
"""
import asyncio, json, os, subprocess, sys, tempfile, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice')

# Callers: telephone band 300-3400 Hz, compressed, a little line hiss, 22.05 kHz mono 32 kbps.
PHONE = ('[0:a]aformat=channel_layouts=mono,highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400,'
         'acompressor=threshold=-20dB:ratio=4:attack=5:release=60:makeup=2,volume=0.9[v];'
         'anoisesrc=color=pink:amplitude=0.006:sample_rate=24000[n];'
         '[v][n]amix=inputs=2:duration=first:normalize=0,aresample=22050[out]')
# Player: own headset mic, gentle band limit + light compression, 24 kHz mono 40 kbps.
HEADSET = ('[0:a]aformat=channel_layouts=mono,highpass=f=150,lowpass=f=6500,'
           'acompressor=threshold=-18dB:ratio=2.5:attack=8:release=80:makeup=1.5,aresample=24000[out]')


def fnv1a(s: str) -> str:
    h = 0x811C9DC5
    for b in unicodedata.normalize('NFC', s).encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


async def gen(job, sem, force):
    dst = os.path.join(OUT, job['file'])
    if os.path.exists(dst) and not force:
        return 'skip'
    p = job['profile']
    key = f"{p['voice']}|{p['pitch']}|{p['rate']}|{p['fx']}|{job['text']}"
    assert fnv1a(key) == job['hash'], ('hash mismatch with voices.ts', job['file'])
    import edge_tts
    async with sem:
        with tempfile.TemporaryDirectory() as td:
            raw = os.path.join(td, 'raw.mp3')
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(job['text'], p['voice'], rate=p['rate'], pitch=p['pitch']).save(raw)
                    break
                except Exception as e:  # transient network errors
                    if attempt == 3:
                        raise
                    await asyncio.sleep(1.5 * (attempt + 1))
            phone = p['fx'] == 'phone'
            cmd = ['ffmpeg', '-v', 'error', '-y', '-i', raw, '-filter_complex', PHONE if phone else HEADSET,
                   '-map', '[out]', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '32k' if phone else '40k', dst]
            proc = await asyncio.create_subprocess_exec(*cmd)
            if await proc.wait() != 0:
                raise RuntimeError(f'ffmpeg failed for {job["file"]}')
    return 'gen'


async def main():
    force = '--force' in sys.argv
    jobs = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'scripts', 'dump_voice_lines.mjs')], cwd=ROOT))
    os.makedirs(OUT, exist_ok=True)
    sem = asyncio.Semaphore(6)
    res = await asyncio.gather(*(gen(j, sem, force) for j in jobs))
    wanted = {j['file'] for j in jobs}
    removed = 0
    for f in os.listdir(OUT):
        if f.endswith('.mp3') and f not in wanted:
            os.remove(os.path.join(OUT, f)); removed += 1
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in wanted)
    print(f'clips: {len(jobs)} (generated {res.count("gen")}, kept {res.count("skip")}, removed {removed}); '
          f'total {total/1024:.0f} KiB')


if __name__ == '__main__':
    asyncio.run(main())
