/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { globalScene } from "#app/global-scene";
import type { BackgroundMusic } from "#audio/background-music";
import { applyGameSpeedMult } from "#system/game-speed";
import type { FixedInt } from "#utils/common";
import { sleep } from "#utils/common";
import { AudioBufferSink, BufferSource, Input, MP3, MP4, OGG } from "mediabunny";
import Phaser from "phaser";

/** How far ahead of the playhead to decode, in seconds. */
const LEAD_SECONDS = 2;
/** Small delay before the first buffer, so it isn't scheduled in the past. */
const START_DELAY = 0.05;
/** Shortest sleep between audio-clock checks, in milliseconds. */
const MIN_POLL_MS = 50;
/** Passes kept for position lookups; only the current and adjacent passes are ever needed. */
const MAX_TRACKED_PASSES = 3;

/** How a {@linkcode StreamingTrack} plays, set when it is created. */
interface StreamingTrackOptions {
  /** Whether to restart from {@linkcode loopPoint} on reaching the end, instead of finishing. */
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
 * A music track that decodes incrementally while playing,
 * instead of decoding the whole file up front.
 *
 * @privateRemarks
 * Intended to mirror the parts of Phaser's sound API that {@linkcode BackgroundMusic} uses.
 *
 * This allows `StreamingTrack` to be used in place of a Phaser sound object,
 * which loads the whole file into memory rather than streaming it.
 *
 * Music tracks can be large, sometimes in the tens of megabytes.
 */
export class StreamingTrack extends Phaser.Events.EventEmitter {
  /** Intended to be the same as Phaser's audio context. */
  private readonly ctx: AudioContext;
  /** This track's volume control, between its buffers and Phaser's master output. */
  private readonly output: GainNode;
  /** Set of decoded buffers that are scheduled or playing. */
  private readonly nodes = new Set<AudioBufferSourceNode>();
  /** Mediabunny's decoder for the track */
  private readonly sink: AudioBufferSink;
  private readonly options: StreamingTrackOptions;

  /** The most recent passes through the track, oldest first, used to work out the current position. */
  private passes: Pass[] = [];
  /**
   * Incremented on every start/stop, allowing clean up of stale decode loops and scheduled audio.
   *
   * @remarks
   * Each run of the decode loop captures the value when it starts (as `gen`) and stops as soon as it no longer
   * matches.
   * This is necessary as an `async` loop can't be cancelled from outside.
   * Without this, a loop from before a seek or restart would keep scheduling audio alongside the new one.
   */
  private generation = 0;
  /** Whether audio is currently scheduled or playing; `false` while paused, stopped or finished. */
  private playing = false;
  /** Whether playback was paused and can be resumed from {@linkcode pausedAt}. */
  private paused = false;
  /** Track position to resume from, in seconds; the position when paused, or `0` once stopped or finished. */
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

  /**
   * Should not be invoked outside of this class; StreamingTrack should be created via {@linkcode create}.
   */
  private constructor(sink: AudioBufferSink, options: StreamingTrackOptions) {
    super();

    this.sink = sink;
    this.options = options;
    const manager = globalScene.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = manager.context;
    this.output = new GainNode(this.ctx, { gain: 0 });
    // Phaser's internal input node, so master volume and mute still apply
    this.output.connect(manager.destination);
  }

  public get isPlaying(): boolean {
    return this.playing;
  }

  public get isPaused(): boolean {
    return this.paused;
  }

  /** Current position in seconds */
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

  /**
   * Set the volume immediately, cancelling any fade in progress.
   * @param value - The new volume, where `1` is full volume
   * @returns `this`
   */
  public setVolume(value: number): this {
    const gain = this.output.gain;
    const now = this.ctx.currentTime;
    gain.cancelScheduledValues(now).setValueAtTime(value, now);
    return this;
  }

  /**
   * Ramp the volume on the audio clock.
   * @param value - The volume to ramp to
   * @param duration - The duration of the fade in milliseconds (adjusted by gameSpeed unless it is {@linkcode FixedInt})
   */
  public fadeTo(value: number, duration: number | FixedInt): void {
    const gain = this.output.gain;
    const now = this.ctx.currentTime;
    gain
      .cancelScheduledValues(now)
      .setValueAtTime(gain.value, now)
      .linearRampToValueAtTime(value, now + applyGameSpeedMult(duration) / 1000);
  }

  /** Stop playback, disconnect from the audio output and remove all listeners. */
  public override destroy(): void {
    this.halt();
    this.output.disconnect();
    super.destroy();
  }

  /**
   * Start a new run of the decode loop, after stopping any current one.
   * @param from - Track position to start from, in seconds
   */
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

  /**
   * Work out the current track position from the audio clock.
   * @returns The position in seconds within the pass now playing, or `0` if nothing has been scheduled yet
   */
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
   * @param gen - The generation of playback this belongs to, captured when it started (see {@linkcode StreamingTrack.generation | generation})
   * @param from - Track position to start from, in seconds
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
   * @param gen - Generation of the playback this belongs to, captured when it started; see {@linkcode StreamingTrack.generation | generation}
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
   * @param passStart - Context time at which the pass starts playing
   * @param trackFrom - Track position the pass starts from, in seconds
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
   * @param gen - Generation of the playback this belongs to, captured when it started; see {@linkcode StreamingTrack.generation | generation}
   * @param target - The context time to wait for, in seconds
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

  /**
   * @param gen - Generation of the playback this belongs to, captured when it started; see {@linkcode StreamingTrack.generation | generation}
   * @returns Whether `gen` still refers to the active playback, i.e. it hasn't been stopped or restarted since
   */
  private isCurrent(gen: number): boolean {
    return gen === this.generation;
  }

  /** Mark a non-looping track as finished and notify listeners. */
  private finish(): void {
    this.playing = false;
    this.pausedAt = 0;
    this.emit("complete");
  }

  /**
   * Schedule a decoded buffer to play, and forget it once it has.
   * @param buffer - The decoded audio
   * @param when - Context time at which to start playing it, in seconds
   * @param offset - How far into the buffer to start, in seconds
   */
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
