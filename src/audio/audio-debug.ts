/**
 * Meant to be used only during development, to inspect memory footprint of audio assets.
 * @module
 */
import type Phaser from "phaser";

type StereoRow = {
  key: string;
  verdict: string;
  correlation: number;
  balanceDb: number;
  seconds: number;
  MB: number;
  monoSavesMB: number;
};

function bufferMB(buf: AudioBuffer): number {
  return (buf.length * buf.numberOfChannels * 4) / 1048576;
}

/**
 * Determine the extent to which each stereo buffer in the cache is actually stereo, and how much space could be saved by converting to mono.
 * @param audioCache - The Phaser audio cache to analyze
 * @returns An array of {@linkcode StereoRow}s, sorted by verdict and size
 */
function analyzeStereo(audioCache: Phaser.Cache.BaseCache): StereoRow[] {
  const rows: StereoRow[] = [];

  for (const key of audioCache.getKeys()) {
    const buf = audioCache.get(key);
    if (!(buf instanceof AudioBuffer) || buf.numberOfChannels !== 2) {
      continue;
    }

    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    let sumLL = 0;
    let sumRR = 0;
    let sumLR = 0;
    for (let i = 0; i < L.length; i++) {
      sumLL += L[i] * L[i];
      sumRR += R[i] * R[i];
      sumLR += L[i] * R[i];
    }

    const tiny = 1e-9;
    const loudest = Math.max(sumLL, sumRR);
    const correlation = sumLR / Math.sqrt(sumLL * sumRR + tiny);
    const balanceDb = 10 * Math.log10((sumLL + tiny) / (sumRR + tiny));

    let verdict: string;
    if (loudest < tiny) {
      verdict = "silent";
    } else if (Math.min(sumLL, sumRR) < loudest * 1e-6) {
      verdict = "one side silent";
    } else if (correlation >= 0.999 && Math.abs(balanceDb) < 0.5) {
      verdict = "duplicate";
    } else if (correlation >= 0.999) {
      verdict = "mono, panned";
    } else if (correlation >= 0.98) {
      verdict = "nearly mono";
    } else if (correlation < 0) {
      verdict = "out of phase";
    } else {
      verdict = "true stereo";
    }

    const mb = bufferMB(buf);
    rows.push({
      key,
      verdict,
      correlation: +correlation.toFixed(4),
      balanceDb: +balanceDb.toFixed(1),
      seconds: +buf.duration.toFixed(1),
      MB: +mb.toFixed(2),
      monoSavesMB: +(mb / 2).toFixed(2),
    });
  }

  rows.sort((a, b) => a.verdict.localeCompare(b.verdict) || b.MB - a.MB);
  console.table(rows);

  const totals: Record<string, { count: number; savesMB: number }> = {};
  for (const r of rows) {
    totals[r.verdict] ??= { count: 0, savesMB: 0 };
    totals[r.verdict].count++;
    totals[r.verdict].savesMB += r.monoSavesMB;
  }
  for (const t of Object.values(totals)) {
    t.savesMB = +t.savesMB.toFixed(2);
  }
  console.table(totals);

  return rows;
}

/**
 * Install audio debug tools on the global `window` object, for use in the browser console.
 * @remarks
 * This is meant to be used only during development, to inspect memory footprint of audio assets.
 * @example
 * ```ts
 * import { installAudioDebug } from "#audio/audio-debug";
 * installAudioDebug(game);
 * ```
 */
export function installAudioDebug(game: Phaser.Game): void {
  const tools = {
    // Stereo vs. mono breakdown of everything currently in the audio cache
    stereo: () => analyzeStereo(game.cache.audio),

    /**
     * Display a table of all decoded audio buffers currently in the cache,
     * with their size in MB and duration in seconds.
     */
    cache: () => {
      const rows = game.cache.audio
        .getKeys()
        .map(key => ({ key, buf: game.cache.audio.get(key) }))
        .filter(({ buf }) => buf instanceof AudioBuffer)
        .map(({ key, buf }) => ({
          key,
          channels: buf.numberOfChannels,
          seconds: +buf.duration.toFixed(1),
          sampleRate: buf.sampleRate,
          MB: +bufferMB(buf).toFixed(2),
        }))
        .sort((a, b) => b.MB - a.MB);
      console.table(rows);
      const total = rows.reduce((sum, r) => sum + r.MB, 0);
      console.log(`Total decoded audio in cache: ${total.toFixed(2)} MB`);
      return rows;
    },

    /**
     * Display a table of all currently playing sounds, with their key, whether they are playing, and their duration in seconds.
     */
    sounds: () => {
      const rows = ((game.sound as any).sounds ?? []).map((s: any) => ({
        key: s.key,
        playing: s.isPlaying,
        channels: s.audioBuffer?.numberOfChannels,
        seconds: s.audioBuffer ? +s.audioBuffer.duration.toFixed(1) : undefined,
        inCache: game.cache.audio.exists(s.key),
      }));
      console.table(rows);
      return rows;
    },
  };

  (window as any).audioDebug = tools;
  console.log("audioDebug ready: audioDebug.stereo(), .cache(), .sounds()");
}
