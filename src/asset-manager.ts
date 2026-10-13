/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { queueAssetRequest } from "#app/asset-requests";
import type { AnimSpec, AssetRef, AssetRequest } from "#types/asset-set";
import Phaser from "phaser";

/** The loader event type for each kind of request, used in `filecomplete-<type>-<key>` events. */
const LOADER_FILE_TYPES = {
  image: "image",
  atlas: "atlasjson",
  spritesheet: "spritesheet",
  audio: "audio",
} as const satisfies Record<AssetRequest["kind"], string>;

/**
 * Get a string identifying an asset.
 * Textures and audio are separate namespaces in Phaser, so the same key can name one of each.
 * @param ref - The asset to identify
 * @returns `"audio:<key>"` for audio, `"texture:<key>"` otherwise
 */
export function getAssetId(ref: AssetRef): string {
  return `${ref.kind === "audio" ? "audio" : "texture"}:${ref.key}`;
}

/**
 * Where loaded assets live, and what is currently using them.
 * Kept separate from {@linkcode AssetManager} so the manager does not depend on any particular scene, and can be tested
 * without Phaser.
 */
export interface AssetStore {
  hasTexture(key: string): boolean;
  /** Remove a texture, along with the animation that shares its key. */
  removeTexture(key: string): void;
  hasAudio(key: string): boolean;
  /** Remove an audio cache entry, along with any sound objects still holding it. */
  removeAudio(key: string): void;
  /** @returns Whether any sound using this audio is playing or paused */
  isAudioPlaying(key: string): boolean;
  /**
   * Call `callback` once no sound using this audio is playing or paused any more.
   * Calls it straight away if none is.
   */
  onAudioIdle(key: string, callback: () => void): void;
  /** Create the animation for an atlas from its frames, if it doesn't exist yet. */
  createAnimation(key: string, spec: AnimSpec): void;
  /** @returns The keys of every texture used by a game object in any scene, visible or not */
  getTexturesInUse(): Set<string>;
}

/**
 * An {@linkcode AssetStore} backed by a Phaser game.
 * Textures, animations, the audio cache and the sound manager all belong to the game, so they are shared by every scene.
 */
export class PhaserAssetStore implements AssetStore {
  private readonly game: Phaser.Game;

  constructor(game: Phaser.Game) {
    this.game = game;
  }

  public hasTexture(key: string): boolean {
    return this.game.textures.exists(key);
  }

  public removeTexture(key: string): void {
    // Removed first so it can't be replayed with frames from the destroyed texture
    if (this.game.anims.exists(key)) {
      this.game.anims.remove(key);
    }
    this.game.textures.remove(key);
  }

  public hasAudio(key: string): boolean {
    return this.game.cache.audio.exists(key);
  }

  public removeAudio(key: string): void {
    // Sound objects keep their own reference to the decoded audio, so they must go too for it to be freed
    this.game.sound.removeByKey(key);
    this.game.cache.audio.remove(key);
  }

  public isAudioPlaying(key: string): boolean {
    return this.game.sound.getAll(key).some(sound => sound.isPlaying || sound.isPaused);
  }

  public onAudioIdle(key: string, callback: () => void): void {
    const busy = this.game.sound.getAll(key).filter(sound => sound.isPlaying || sound.isPaused);
    if (busy.length === 0) {
      callback();
      return;
    }

    let remaining = busy.length;
    for (const sound of busy) {
      const done = (): void => {
        sound
          .off(Phaser.Sound.Events.COMPLETE, done)
          .off(Phaser.Sound.Events.STOP, done)
          .off(Phaser.Sound.Events.DESTROY, done);
        remaining--;
        if (remaining === 0) {
          // Wait until Phaser has finished handling the event, as it may still be cleaning up the sound
          queueMicrotask(callback);
        }
      };
      sound
        .once(Phaser.Sound.Events.COMPLETE, done)
        .once(Phaser.Sound.Events.STOP, done)
        .once(Phaser.Sound.Events.DESTROY, done);
    }
  }

  public createAnimation(key: string, spec: AnimSpec): void {
    if (this.game.anims.exists(key)) {
      return;
    }
    const originalWarn = console.warn;
    // Ignore warnings for missing frames, because there will be a lot
    console.warn = () => {};
    const frames = this.game.anims.generateFrameNames(key, {
      zeroPad: 4,
      suffix: ".png",
      start: 1,
      end: spec.end,
    });
    console.warn = originalWarn;
    this.game.anims.create({ key, frames, frameRate: spec.frameRate, repeat: spec.repeat });
  }

  public getTexturesInUse(): Set<string> {
    const used = new Set<string>();
    const visit = (obj: Phaser.GameObjects.GameObject): void => {
      const key = (obj as Partial<Phaser.GameObjects.Components.Texture>).texture?.key;
      if (key != null) {
        used.add(key);
      }
      if (obj instanceof Phaser.GameObjects.Container) {
        obj.list.forEach(visit);
      }
    };
    for (const scene of this.game.scene.scenes) {
      scene.children.list.forEach(visit);
    }
    return used;
  }
}

/**
 * Loads, tracks and unloads assets that are only needed some of the time.
 *
 * @remarks
 * Owners (Pokémon, trainers, mystery encounters, the arena) describe what they need as {@linkcode AssetRequest}s,
 * and load them with {@linkcode load}. A {@linkcode sweep} then removes every asset this manager loaded that is no
 * longer needed: anything not retained, not requested by a registered root provider, not still loading, and not used
 * by any game object. Audio that is still being played is removed once its sounds finish, if it is still unneeded then,
 * so sounds are never cut off.
 *
 * Only assets this manager loaded (or was told to {@linkcode adopt}) are ever removed, so anything loaded elsewhere is
 * left alone.
 *
 * The manager belongs to the game, not to a scene: assets are shared by all scenes, and each load uses the loader of
 * the scene that asked for it.
 */
export class AssetManager {
  private readonly store: AssetStore;
  /** Assets this manager may remove, by {@linkcode getAssetId} */
  private readonly managed = new Map<string, AssetRef>();
  /** Assets that are never removed, by {@linkcode getAssetId} */
  private readonly permanent = new Set<string>();
  /** Loads that haven't finished yet, by {@linkcode getAssetId} */
  private readonly inFlight = new Map<string, Promise<void>>();
  private readonly rootProviders = new Set<() => Iterable<AssetRef>>();
  /** Unneeded audio waiting for its sounds to finish before being removed, by {@linkcode getAssetId} */
  private readonly waitingForAudio = new Set<string>();

  constructor(store: AssetStore) {
    this.store = store;
  }

  /**
   * Load any of the given assets that aren't loaded yet, and track them so they can be unloaded once unused.
   * Assets that were already loaded by other code are not tracked.
   * @param requests - The assets to load
   * @param scene - The scene whose loader to use
   * @returns A promise that resolves once all of the requested assets have finished loading (or failed to)
   */
  public async load(requests: Iterable<AssetRequest>, scene: Phaser.Scene): Promise<void> {
    const requestList = [...requests];
    const pending: Promise<void>[] = [];
    let queued = false;

    for (const request of requestList) {
      const id = getAssetId(request);
      let inFlight = this.inFlight.get(id);
      if (inFlight == null && !this.isLoaded(request)) {
        inFlight = this.queue(request, scene.load).finally(() => this.inFlight.delete(id));
        this.inFlight.set(id, inFlight);
        queued = true;
      }
      if (inFlight != null) {
        pending.push(inFlight);
      }
    }

    if (queued && !scene.load.isLoading()) {
      scene.load.start();
    }
    await Promise.all(pending);

    // Done for every request, in case the asset was loaded by a request without an animation, or by other code
    for (const request of requestList) {
      if (request.kind === "atlas" && request.anim != null) {
        this.store.createAnimation(request.key, request.anim);
      }
    }
  }

  /**
   * Start tracking assets that were already loaded elsewhere, so they can be unloaded once unused.
   * Assets that aren't loaded are ignored.
   * @param refs - The assets to track
   */
  public adopt(refs: Iterable<AssetRef>): void {
    for (const ref of refs) {
      if (this.isLoaded(ref)) {
        this.managed.set(getAssetId(ref), ref);
      }
    }
  }

  /**
   * Never unload the given assets.
   * @param refs - The assets to keep
   */
  public retain(refs: Iterable<AssetRef>): void {
    for (const ref of refs) {
      this.permanent.add(getAssetId(ref));
    }
  }

  /**
   * Register a function that lists assets that are still needed. It is called on every {@linkcode sweep}.
   * @param provider - The function listing the needed assets
   * @returns A function that unregisters the provider
   */
  public addRootProvider(provider: () => Iterable<AssetRef>): () => void {
    this.rootProviders.add(provider);
    return () => this.rootProviders.delete(provider);
  }

  /**
   * Unload every tracked asset that is no longer needed.
   */
  public sweep(): void {
    this.unloadUnused([...this.managed]);
  }

  /**
   * Unload each of the given tracked assets that is no longer needed.
   * Audio that is still being played is unloaded once its sounds finish, if it is still unneeded then.
   * @param candidates - The tracked assets to consider, as `[id, ref]` pairs
   */
  private unloadUnused(candidates: readonly (readonly [id: string, ref: AssetRef])[]): void {
    if (candidates.length === 0) {
      return;
    }

    const keep = this.getNeededAssetIds(candidates.some(([, ref]) => ref.kind !== "audio"));
    for (const [id, ref] of candidates) {
      if (keep.has(id) || this.inFlight.has(id) || !this.managed.has(id)) {
        continue;
      }
      if (ref.kind === "audio") {
        if (this.store.isAudioPlaying(ref.key)) {
          this.unloadWhenIdle(id, ref);
          continue;
        }
        this.store.removeAudio(ref.key);
      } else {
        this.store.removeTexture(ref.key);
      }
      this.managed.delete(id);
    }
  }

  /**
   * Get every asset that must not be unloaded: retained ones, ones listed by a root provider, and optionally textures
   * used by game objects.
   * @param includeTexturesInUse - Whether to look for textures used by game objects; skipped when only audio is being
   * checked, as it means walking every game object
   * @returns The ids of the needed assets
   */
  private getNeededAssetIds(includeTexturesInUse: boolean): Set<string> {
    const keep = new Set(this.permanent);
    for (const provider of this.rootProviders) {
      for (const ref of provider()) {
        keep.add(getAssetId(ref));
      }
    }
    if (includeTexturesInUse) {
      for (const key of this.store.getTexturesInUse()) {
        keep.add(`texture:${key}`);
      }
    }
    return keep;
  }

  /**
   * Unload tracked audio once every sound using it has finished, if it is still unneeded then.
   * @param id - The audio's {@linkcode getAssetId | id}
   * @param ref - The audio
   */
  private unloadWhenIdle(id: string, ref: AssetRef): void {
    if (this.waitingForAudio.has(id)) {
      return;
    }
    this.waitingForAudio.add(id);
    this.store.onAudioIdle(ref.key, () => {
      this.waitingForAudio.delete(id);
      this.unloadUnused([[id, ref]]);
    });
  }

  private isLoaded(ref: AssetRef): boolean {
    return ref.kind === "audio" ? this.store.hasAudio(ref.key) : this.store.hasTexture(ref.key);
  }

  /**
   * Queue a single request and track it once it has loaded.
   * @param request - The request to queue
   * @param loader - The loader to queue it on
   * @returns A promise that resolves once the file has loaded or failed to
   */
  private queue(request: AssetRequest, loader: Phaser.Loader.LoaderPlugin): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    const completeEvent = `filecomplete-${LOADER_FILE_TYPES[request.kind]}-${request.key}`;

    const finish = (): void => {
      loader
        .off(completeEvent, finish)
        .off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError)
        .off(Phaser.Loader.Events.COMPLETE, finish);
      if (this.isLoaded(request)) {
        this.managed.set(getAssetId(request), request);
      }
      resolve();
    };
    const onError = (file: Phaser.Loader.File): void => {
      if (file.key === request.key) {
        finish();
      }
    };

    loader
      .once(completeEvent, finish)
      .on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError)
      // Covers files the loader skips without an event, e.g. audio with no playable format
      .once(Phaser.Loader.Events.COMPLETE, finish);
    queueAssetRequest(loader, request);

    return promise;
  }
}
