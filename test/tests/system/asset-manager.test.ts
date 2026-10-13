/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AssetManager, type AssetStore } from "#app/asset-manager";
import type { AnimSpec, AssetRequest } from "#types/asset-set";
import { beforeEach, describe, expect, it, vi } from "vitest";

class FakeStore implements AssetStore {
  public readonly textures = new Set<string>();
  public readonly audio = new Set<string>();
  public readonly anims = new Set<string>();
  public readonly inUse = new Set<string>();
  /** Audio keys with a sound currently playing */
  public readonly playing = new Set<string>();
  /** Callbacks waiting for each audio key's sounds to finish */
  public readonly idleCallbacks = new Map<string, (() => void)[]>();

  public hasTexture(key: string): boolean {
    return this.textures.has(key);
  }

  public removeTexture(key: string): void {
    this.textures.delete(key);
    this.anims.delete(key);
  }

  public hasAudio(key: string): boolean {
    return this.audio.has(key);
  }

  public removeAudio(key: string): void {
    this.audio.delete(key);
  }

  public isAudioPlaying(key: string): boolean {
    return this.playing.has(key);
  }

  public onAudioIdle(key: string, callback: () => void): void {
    if (!this.playing.has(key)) {
      callback();
      return;
    }
    this.idleCallbacks.set(key, [...(this.idleCallbacks.get(key) ?? []), callback]);
  }

  /** Finish playing every sound using the given audio. */
  public finishPlaying(key: string): void {
    this.playing.delete(key);
    const callbacks = this.idleCallbacks.get(key) ?? [];
    this.idleCallbacks.delete(key);
    for (const callback of callbacks) {
      callback();
    }
  }

  public createAnimation(key: string, _spec: AnimSpec): void {
    this.anims.add(key);
  }

  public getTexturesInUse(): Set<string> {
    return new Set(this.inUse);
  }
}

/** A loader that records what is queued, and only finishes files when told to. */
class FakeLoader extends Phaser.Events.EventEmitter {
  public readonly queued: string[] = [];
  private loading = false;
  private readonly store: FakeStore;

  constructor(store: FakeStore) {
    super();
    this.store = store;
  }

  public image(key: string): void {
    this.queued.push(`image:${key}`);
  }

  public atlas(key: string): void {
    this.queued.push(`atlasjson:${key}`);
  }

  public spritesheet(key: string): void {
    this.queued.push(`spritesheet:${key}`);
  }

  public audio(key: string): void {
    this.queued.push(`audio:${key}`);
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public start(): void {
    this.loading = true;
  }

  /** Finish loading one queued file, adding it to the store. */
  public finish(type: "image" | "atlasjson" | "spritesheet" | "audio", key: string): void {
    (type === "audio" ? this.store.audio : this.store.textures).add(key);
    this.emit(`filecomplete-${type}-${key}`, key, type);
  }

  /** Fail one queued file. */
  public fail(key: string): void {
    this.emit(Phaser.Loader.Events.FILE_LOAD_ERROR, { key });
  }

  /** Finish the whole batch. */
  public complete(): void {
    this.loading = false;
    this.emit(Phaser.Loader.Events.COMPLETE);
  }
}

const cry = (key: string): AssetRequest => ({ kind: "audio", key, url: `${key}.m4a` });
const image = (key: string): AssetRequest => ({ kind: "image", key, url: `${key}.png` });
const sprite = (key: string, anim?: AnimSpec): AssetRequest => ({
  kind: "atlas",
  key,
  textureUrl: `${key}.png`,
  atlasUrl: `${key}.json`,
  anim,
});

/** Whether a promise has settled, checked after letting pending callbacks run. */
async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  const pending = Symbol("pending");
  const result = await Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(pending), 0))]);
  return result !== pending;
}

describe("AssetManager", () => {
  let store: FakeStore;
  let loader: FakeLoader;
  let scene: Phaser.Scene;
  let manager: AssetManager;

  beforeEach(() => {
    store = new FakeStore();
    loader = new FakeLoader(store);
    scene = { load: loader } as unknown as Phaser.Scene;
    manager = new AssetManager(store);
  });

  describe("load", () => {
    it("queues only assets that aren't loaded yet, and starts the loader", async () => {
      store.textures.add("already_loaded");

      const promise = manager.load([image("already_loaded"), image("new_image"), cry("cry/1")], scene);

      expect(loader.queued).toEqual(["image:new_image", "audio:cry/1"]);
      expect(loader.isLoading()).toBe(true);
      loader.complete();
      await promise;
    });

    it("doesn't start the loader when there is nothing to load", async () => {
      store.textures.add("already_loaded");

      await manager.load([image("already_loaded")], scene);

      expect(loader.isLoading()).toBe(false);
    });

    it("resolves once its own files finish, not when other files do", async () => {
      const promise = manager.load([image("mine")], scene);
      loader.finish("image", "someone_elses");
      expect(await isSettled(promise)).toBe(false);

      loader.finish("image", "mine");
      expect(await isSettled(promise)).toBe(true);
    });

    it("resolves when its file fails to load", async () => {
      const promise = manager.load([image("broken")], scene);
      loader.fail("broken");

      expect(await isSettled(promise)).toBe(true);
    });

    it("resolves when the batch completes without its file", async () => {
      const promise = manager.load([cry("cry/unplayable")], scene);
      loader.complete();

      expect(await isSettled(promise)).toBe(true);
    });

    it("queues an asset only once while it is loading", async () => {
      const first = manager.load([image("shared")], scene);
      const second = manager.load([image("shared")], scene);

      expect(loader.queued).toEqual(["image:shared"]);

      loader.finish("image", "shared");
      expect(await isSettled(first)).toBe(true);
      expect(await isSettled(second)).toBe(true);
    });

    it("treats a texture and an audio file with the same key as different assets", async () => {
      const promise = manager.load([image("same"), cry("same")], scene);

      expect(loader.queued).toEqual(["image:same", "audio:same"]);
      loader.complete();
      await promise;
    });

    it("creates the animation for an atlas after it loads", async () => {
      const promise = manager.load([sprite("pkmn__1", { end: 400, frameRate: 10, repeat: -1 })], scene);
      expect(store.anims.has("pkmn__1")).toBe(false);

      loader.finish("atlasjson", "pkmn__1");
      await promise;

      expect(store.anims.has("pkmn__1")).toBe(true);
    });

    it("creates a missing animation for an atlas that was already loaded", async () => {
      store.textures.add("pkmn__1");

      await manager.load([sprite("pkmn__1", { end: 400, frameRate: 10, repeat: -1 })], scene);

      expect(store.anims.has("pkmn__1")).toBe(true);
    });
  });

  describe("sweep", () => {
    /** Load and finish the given requests through the manager. */
    async function loadAll(...requests: AssetRequest[]): Promise<void> {
      const promise = manager.load(requests, scene);
      for (const request of requests) {
        loader.finish(request.kind === "atlas" ? "atlasjson" : request.kind, request.key);
      }
      await promise;
    }

    it("removes loaded assets that nothing needs", async () => {
      await loadAll(sprite("pkmn__1", { end: 400, frameRate: 10, repeat: -1 }), cry("cry/1"));

      manager.sweep();

      expect(store.textures.has("pkmn__1")).toBe(false);
      expect(store.anims.has("pkmn__1")).toBe(false);
      expect(store.audio.has("cry/1")).toBe(false);
    });

    it("never removes assets loaded by other code", async () => {
      store.textures.add("loaded_elsewhere");
      await loadAll(image("loaded_elsewhere"));

      manager.sweep();

      expect(store.textures.has("loaded_elsewhere")).toBe(true);
    });

    it("removes adopted assets once unused", () => {
      store.textures.add("starting_biome_bg");
      manager.adopt([image("starting_biome_bg"), image("never_loaded")]);

      manager.sweep();

      expect(store.textures.has("starting_biome_bg")).toBe(false);
    });

    it("keeps retained assets", async () => {
      await loadAll(image("town_bg"));
      manager.retain([image("town_bg")]);

      manager.sweep();

      expect(store.textures.has("town_bg")).toBe(true);
    });

    it("keeps assets listed by root providers, and drops them once unregistered", async () => {
      await loadAll(cry("cry/1"), cry("cry/2"));
      const unregister = manager.addRootProvider(() => [cry("cry/1")]);

      manager.sweep();
      expect(store.audio.has("cry/1")).toBe(true);
      expect(store.audio.has("cry/2")).toBe(false);

      unregister();
      manager.sweep();
      expect(store.audio.has("cry/1")).toBe(false);
    });

    it("keeps textures used by game objects", async () => {
      await loadAll(sprite("pkmn__25"));
      store.inUse.add("pkmn__25");

      manager.sweep();

      expect(store.textures.has("pkmn__25")).toBe(true);
    });

    it("doesn't remove assets that are still loading", async () => {
      await loadAll(image("reloading"));
      // Simulate the asset having been removed by other code, then requested again
      store.textures.delete("reloading");
      const reload = manager.load([image("reloading")], scene);
      const removeTexture = vi.spyOn(store, "removeTexture");

      manager.sweep();

      expect(removeTexture).not.toHaveBeenCalled();
      loader.finish("image", "reloading");
      await reload;
    });

    it("waits for audio that is still playing to finish before removing it", async () => {
      await loadAll(cry("cry/1"));
      store.playing.add("cry/1");

      manager.sweep();
      expect(store.audio.has("cry/1")).toBe(true);

      store.finishPlaying("cry/1");
      expect(store.audio.has("cry/1")).toBe(false);
    });

    it("keeps audio that became needed while its sound was finishing", async () => {
      await loadAll(cry("cry/1"));
      store.playing.add("cry/1");
      manager.sweep();

      manager.addRootProvider(() => [cry("cry/1")]);
      store.finishPlaying("cry/1");

      expect(store.audio.has("cry/1")).toBe(true);
    });

    it("only waits once for the same audio across sweeps", async () => {
      await loadAll(cry("cry/1"));
      store.playing.add("cry/1");

      manager.sweep();
      manager.sweep();

      expect(store.idleCallbacks.get("cry/1")).toHaveLength(1);
    });

    it("doesn't look for textures in use when only audio is being rechecked", async () => {
      await loadAll(cry("cry/1"));
      store.playing.add("cry/1");
      manager.sweep();
      const getTexturesInUse = vi.spyOn(store, "getTexturesInUse");

      store.finishPlaying("cry/1");

      expect(getTexturesInUse).not.toHaveBeenCalled();
    });

    it("only keeps the audio when a root provider lists audio with a texture's key", async () => {
      await loadAll(image("same"), cry("same"));
      manager.addRootProvider(() => [cry("same")]);

      manager.sweep();

      expect(store.audio.has("same")).toBe(true);
      expect(store.textures.has("same")).toBe(false);
    });
  });
});
