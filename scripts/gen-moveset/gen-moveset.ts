/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Command line tool that generates movesets for a Pokémon species.
 */

import { __INTERNAL_TEST_EXPORTS, generateMoveset } from "#app/ai/ai-moveset-gen";
import { BattleType } from "#enums/battle-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerSlot } from "#enums/trainer-slot";
import { EnemyPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { randomString } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import net from "node:net";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { SamplerPayload } from "./types";

/**
 * Parameters for {@linkcode createTestablePokemon}
 */
interface MockPokemonParams {
  /** The level to set the Pokémon to */
  level: number;
  /**
   * Whether the pokemon is a boss or not.
   * @defaultValue `false`
   */
  boss?: boolean;
  /**
   * The trainer slot to assign to the pokemon, if any.
   * @defaultValue `TrainerSlot.NONE`
   */
  trainerSlot?: TrainerSlot;
  /**
   * The form index to assign to the pokemon, if any.
   * This *must* be one of the valid form indices for the species, or the test will break.
   * @defaultValue `0`
   */
  formIndex?: number;
}

/**
 * Construct an `EnemyPokemon` that can be used for testing
 * @param species - The species ID of the pokemon to create
 * @returns The newly created `EnemyPokemon`.
 * @todo Move this to a dedicated unit test util folder if more tests come to rely on it
 */
function createTestablePokemon(
  speciesId: SpeciesId,
  { level, trainerSlot = TrainerSlot.NONE, boss = false, formIndex = 0 }: MockPokemonParams,
): EnemyPokemon {
  const species = getPokemonSpecies(speciesId);
  const pokemon = new EnemyPokemon(species, level, trainerSlot, boss);
  if (formIndex !== 0) {
    const formIndexLength = species?.forms.length;
    expect(formIndex, `${pokemon.name} does not have a form with index ${formIndex}`).toBeLessThan(
      formIndexLength ?? 1,
    );
    pokemon.formIndex = formIndex;
  }

  return pokemon;
}

describe("gen-moveset", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  /**A pokemon object that will be cleaned up after every test */
  let pokemon: EnemyPokemon | undefined;

  // Open the IPC
  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    game = new GameManager(phaserGame);
    game.override.battleType(BattleType.TRAINER).seed(randomString(24));

    // Need to be in a wave for moveset generation to not actually break
    await game.classicMode.runToSummon([SpeciesId.PIKACHU]);

    consoleLog.mockRestore();
  });

  afterEach(() => {
    pokemon?.destroy();
  });

  it("Sample moveset generation", async () => {
    const port = Number(process.env.COMMUNICATION_PORT);
    expect(port).toBeGreaterThan(0);

    const socket = net.createConnection({ port });
    const { promise, resolve } = Promise.withResolvers<SamplerPayload>();
    socket.once("data", data => {
      const payload: SamplerPayload = JSON.parse(data.toString());
      resolve(payload);
    });

    const payload = await promise;

    let trials = "";

    const orig = console.log;

    // Intercept
    if (payload.printWeights) {
      vi.spyOn(console, "log").mockImplementation((...args: any[]) => {
        if (__INTERNAL_TEST_EXPORTS.forceLogging && args[2] === "Pre STAB Move") {
          __INTERNAL_TEST_EXPORTS.forceLogging = false;
          trials += "==== Move Weights ====";
          for (const [key, val] of args[4].entries()) {
            trials += `\n\t${key}: ${val}`;
          }
          trials += "\n==============================";
        } else {
          orig.apply(console, args);
        }
      });
    }
    pokemon = createTestablePokemon(payload.speciesId, { boss: payload.boss, level: payload.level });
    vi.spyOn(pokemon, "hasTrainer").mockReturnValue(payload.forTrainer);
    for (let i = 0; i < payload.trials; ++i) {
      if (payload.printWeights && i === 0) {
        __INTERNAL_TEST_EXPORTS.forceLogging = true;
      }
      generateMoveset(pokemon);
      __INTERNAL_TEST_EXPORTS.forceLogging = false;

      trials += `\n[${pokemon.moveset.map(m => m.getName()).join(", ")}]`;
    }
    const { promise: socketPromise, resolve: writeResolve } = Promise.withResolvers<void>();
    socket.write(trials.trimStart(), () => {
      socket.end();
      writeResolve();
    });
    await socketPromise;
  });
});
