// streaming-track.ts
import { globalScene } from "#app/global-scene";
import type { BackgroundMusic } from "#audio/background-music"; // used in TSDoc comment
import { AudioBufferSink, BufferSource, Input, MP3, MP4, OGG } from "mediabunny";

/** How far ahead of the playhead to decode, in seconds. */
const LEAD_SECONDS = 2;
/** Small delay before the first buffer, so it isn't scheduled in the past. */
const START_DELAY = 0.05;
/** Shortest sleep between audio-clock checks, in milliseconds. */
const MIN_POLL_MS = 50;
/** Passes kept for position lookups; only the current and adjacent passes are ever needed. */
const MAX_TRACKED_PASSES = 3;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

interface StreamingTrackOptions {
  loop: boolean;
  /** Where the loop restarts, in seconds. */
  loopPoint: number;
}

/** Maps AudioContext time to track time for one pass through the track. */
interface Pass {
  /** Context time at which this pass starts playing. */
  ctxStart: number;
  /** Context time that corresponds to track time 0 for this pass. */
  trackZero: number;
}

/**
 * Determine whether the client can stream BGM (it supports the AudioDecoder API).
 *
 */
export function canStreamBgm(): boolean {
  return globalScene.sound instanceof Phaser.Sound.WebAudioSoundManager && typeof AudioDecoder !== "undefined";
}

/**
 * A music track that decodes incrementally while playing, instead of decoding the
 * whole file up front.
 *
 * @privateRemarks
 * Intended to mirror the parts of Phaser's sound API that {@linkcode BackgroundMusic} uses.
 *
 * This allows `StreamingTrack` to be used in place of a Phaser sound object,
 * which loads the whole file into memory rather than streaming it.
 *
 * Music tracks can be large, sometimes in the tens of megabytes.
 *
 */
export class StreamingTrack extends Phaser.Events.EventEmitter {
  private readonly ctx: AudioContext;
  private readonly output: GainNode;
  private readonly nodes = new Set<AudioBufferSourceNode>();
  private readonly sink: AudioBufferSink;
  private readonly options: StreamingTrackOptions;
  private passes: Pass[] = [];
  /** Incremented on every start/stop, so stale decode loops exit. */
  private generation = 0;
  private playing = false;
  private paused = false;
  private pausedAt = 0;

  /**
   * Create a streaming track from an ArrayBuffer of audio data.
   * @param bytes - The audio file as an ArrayBuffer
   * @param options - The options for the streaming track
   * @throws If the file can't be demuxed or decoded on this device
   */
  public static async create(bytes: ArrayBuffer, options: StreamingTrackOptions): Promise<StreamingTrack> {
    const input = new Input({ formats: [OGG, MP4, MP3], source: new BufferSource(bytes) });
    const track = await input.getPrimaryAudioTrack();
    if (track == null || !(await track.canDecode())) {
      throw new Error("Track cannot be streamed on this device");
    }
    return new StreamingTrack(new AudioBufferSink(track), options);
  }

  // Constructor is private as StreamingTrack should be created via `create`.
  private constructor(sink: AudioBufferSink, options: StreamingTrackOptions) {
    super();
    this.sink = sink;
    this.options = options;
    const manager = globalScene.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = manager.context;
    this.output = this.ctx.createGain();
    // Phaser's internal input node, so master volume and mute still apply
    this.output.connect((manager as any).destination);
  }

  public get isPlaying(): boolean {
    return this.playing;
  }

  public get isPaused(): boolean {
    return this.paused;
  }

  /** Current position in seconds, like Phaser's `sound.seek`. */
  public get seek(): number {
    return this.playing ? this.position() : this.pausedAt;
  }

  public play(config?: { seek?: number }): void {
    this.start(config?.seek ?? 0);
  }

  public pause(): void {
    if (!this.playing) {
      return;
    }
    this.pausedAt = this.position();
    this.halt();
    this.paused = true;
  }

  public resume(): void {
    if (this.paused) {
      this.start(this.pausedAt);
    }
  }

  public stop(): void {
    const wasActive = this.playing || this.paused;
    this.halt();
    this.pausedAt = 0;
    if (wasActive) {
      this.emit("stop");
    }
  }

  public setVolume(value: number): this {
    const gain = this.output.gain;
    const now = this.ctx.currentTime;
    gain.cancelScheduledValues(now).setValueAtTime(value, now);
    return this;
  }

  /** Ramp the volume on the audio clock. */
  public fadeTo(value: number, durationMs: number): void {
    const gain = this.output.gain;
    const now = this.ctx.currentTime;
    gain
      .cancelScheduledValues(now)
      .setValueAtTime(gain.value, now)
      .linearRampToValueAtTime(value, now + durationMs / 1000);
  }

  public override destroy(): void {
    this.halt();
    this.output.disconnect();
    super.destroy();
  }

  private start(from: number): void {
    this.halt();
    this.playing = true;
    const gen = this.generation;
    this.pump(gen, from).catch(err => {
      console.error("Streaming playback failed:", err);
      if (gen === this.generation) {
        this.halt();
      }
    });
  }

  /** Stop all scheduled audio and invalidate any running decode loop. */
  private halt(): void {
    this.generation++;
    this.playing = false;
    this.paused = false;
    for (const node of this.nodes) {
      node.stop();
    }
    this.nodes.clear();
    this.passes = [];
  }

  private position(): number {
    const now = this.ctx.currentTime;
    let current = this.passes[0];
    for (const pass of this.passes) {
      if (pass.ctxStart <= now) {
        current = pass;
      }
    }
    return current ? Math.max(0, now - current.trackZero) : 0;
  }

  /**
   * Decode and schedule the track starting at `from`, looping if configured,
   * until it finishes naturally or playback is cancelled.
   */
  private async pump(gen: number, from: number): Promise<void> {
    let passStart = this.ctx.currentTime + START_DELAY;
    let trackFrom = from;

    while (true) {
      const passEnd = await this.schedulePass(gen, passStart, trackFrom);
      if (passEnd == null) {
        return; // cancelled
      }
      if (passEnd <= passStart) {
        throw new Error(`Pass from ${trackFrom}s produced no audio; is loopPoint past the end of the track?`);
      }

      if (!this.options.loop) {
        if (await this.waitForContextTime(gen, passEnd)) {
          this.finish();
        }
        return;
      }

      // The next pass begins exactly where this one ended, from the loop point
      passStart = passEnd;
      trackFrom = this.options.loopPoint;
    }
  }

  /**
   * Decode and schedule one pass through the track, from `trackFrom` to the end.
   * @param passStart - Context time at which this pass should start playing
   * @param trackFrom - Track position to start from, in seconds
   * @returns The context time at which the pass ends, or `null` if playback was cancelled
   */
  private async schedulePass(gen: number, passStart: number, trackFrom: number): Promise<number | null> {
    const trackZero = this.recordPass(passStart, trackFrom);
    let passEnd = passStart;

    for await (const { buffer, timestamp } of this.sink.buffers(trackFrom)) {
      // Returning from inside the loop also tells Mediabunny to stop decoding
      if (!this.isCurrent(gen)) {
        return null;
      }

      // The first buffer may begin slightly before trackFrom; skip into it
      const skip = Math.max(0, trackFrom - timestamp);
      if (skip >= buffer.duration) {
        continue;
      }

      const when = trackZero + timestamp + skip;
      this.schedule(buffer, when, skip);
      passEnd = trackZero + timestamp + buffer.duration;

      // Throttle decoding so we stay at most LEAD_SECONDS ahead of playback
      if (!(await this.waitForContextTime(gen, when - LEAD_SECONDS))) {
        return null;
      }
    }

    return this.isCurrent(gen) ? passEnd : null;
  }

  /**
   * Record how context time maps to track time for a new pass, for position lookups.
   * @returns The context time corresponding to track time 0 in this pass
   */
  private recordPass(passStart: number, trackFrom: number): number {
    const trackZero = passStart - trackFrom;
    this.passes.push({ ctxStart: passStart, trackZero });
    if (this.passes.length > MAX_TRACKED_PASSES) {
      this.passes.shift();
    }
    return trackZero;
  }

  /**
   * Wait until the audio clock reaches `target`.
   *
   * @remarks
   * This keeps waiting while the audio context is suspended, since its clock stops advancing.
   *
   * @returns Whether playback is still current, i.e. `false` if it was cancelled while waiting
   */
  private async waitForContextTime(gen: number, target: number): Promise<boolean> {
    let remaining = target - this.ctx.currentTime;
    while (remaining > 0) {
      await sleep(Math.max(MIN_POLL_MS, remaining * 1000));
      if (!this.isCurrent(gen)) {
        return false;
      }
      remaining = target - this.ctx.currentTime;
    }
    return this.isCurrent(gen);
  }

  /** Whether `gen` still refers to the active playback, i.e. it hasn't been stopped or restarted since. */
  private isCurrent(gen: number): boolean {
    return gen === this.generation;
  }

  /** Mark a non-looping track as finished and notify listeners. */
  private finish(): void {
    this.playing = false;
    this.pausedAt = 0;
    this.emit("complete");
  }

  private schedule(buffer: AudioBuffer, when: number, offset: number): void {
    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.output);
    node.start(when, offset);
    this.nodes.add(node);
    node.onended = () => {
      this.nodes.delete(node);
      node.disconnect();
    };
  }
}
