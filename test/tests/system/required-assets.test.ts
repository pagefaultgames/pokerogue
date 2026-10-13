/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getAssetId } from "#app/asset-manager";
import { type AnimConfig, moveAnims } from "#data/battle-anims";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { Pokemon } from "#field/pokemon";
import { loadCustomMovesForEncounter } from "#mystery-encounters/encounter-phase-utils";
import { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { PartTimerEncounter } from "#mystery-encounters/part-timer-encounter";
import { GameManager } from "#test/framework/game-manager";
import { trainerConfigs } from "#trainers/trainer-config";
import type { AssetRef } from "#types/asset-set";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/** Get the ids of a list of assets, for easy membership checks. */
function idsOf(assets: Iterable<AssetRef>): Set<string> {
  return new Set([...assets].map(getAssetId));
}

/**
 * Give a move a stand-in animation config, since configs aren't fetched in tests.
 * Its spritesheet is `PRAS- <name>` and its sound is `PRSFX- <name>`.
 */
function fakeMoveAnim(moveId: MoveId, name: string): void {
  moveAnims.set(moveId, {
    frames: [[]],
    graphic: `PRAS- ${name}`,
    getSoundResourceNames: () => [`PRSFX- ${name}`],
    getBackgroundResourceNames: () => [],
  } as unknown as AnimConfig);
}

describe("Required assets", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    for (const moveId of [MoveId.SPLASH, MoveId.FLY, MoveId.FUTURE_SIGHT, MoveId.SNORE, MoveId.SWIFT]) {
      moveAnims.delete(moveId);
    }
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.MEW)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH)
      .moveset(MoveId.SPLASH);
  });

  /**
   * Record every key queued on the scene's loader while loading the given Pokémon's assets.
   * Nothing is ever loaded in tests, so everything the Pokémon loads gets queued.
   */
  async function getLoadedIds(pokemon: Pokemon): Promise<Set<string>> {
    const ids = new Set<string>();
    const loader = game.scene.load;
    for (const method of ["atlas", "image", "spritesheet"] as const) {
      vi.spyOn(loader, method).mockImplementation((key: unknown) => {
        ids.add(`texture:${key}`);
        return loader;
      });
    }
    vi.spyOn(loader, "audio").mockImplementation((key: unknown) => {
      ids.add(`audio:${key}`);
      return loader;
    });
    await pokemon.loadAssets();
    return ids;
  }

  describe("Pokémon", () => {
    it("includes its front sprite, back sprite and cry", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      const bulbasaur = game.field.getPlayerPokemon();

      const ids = idsOf(bulbasaur.getRequiredAssets());

      expect(ids).toContain(`texture:${bulbasaur.getSpriteKey()}`);
      expect(ids).toContain(`texture:${bulbasaur.getBattleSpriteKey(true, true)}`);
      expect(ids).toContain(`audio:${bulbasaur.species.getCryKey(bulbasaur.formIndex)}`);
    });

    it("includes everything its loadAssets loads", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      const bulbasaur = game.field.getPlayerPokemon();

      const loaded = await getLoadedIds(bulbasaur);

      expect(loaded.size).toBeGreaterThan(0);
      const required = idsOf(bulbasaur.getRequiredAssets());
      for (const id of loaded) {
        expect(required).toContain(id);
      }
    });

    describe("move animations", () => {
      it("includes the spritesheets and sounds of its moves' animations", async () => {
        await game.classicMode.startBattle(SpeciesId.BULBASAUR);
        const bulbasaur = game.field.getPlayerPokemon();
        fakeMoveAnim(MoveId.SPLASH, "Splash");

        const ids = idsOf(bulbasaur.getRequiredAssets());

        expect(ids).toContain("texture:PRAS- Splash");
        expect(ids).toContain("audio:battle_anims/PRSFX- Splash");
      });

      it("includes the animations of moves still in its move queue, even if not in its moveset", async () => {
        await game.classicMode.startBattle(SpeciesId.BULBASAUR);
        const bulbasaur = game.field.getPlayerPokemon();
        fakeMoveAnim(MoveId.FLY, "Fly");
        bulbasaur.pushMoveQueue({ move: MoveId.FLY, targets: [BattlerIndex.ENEMY], useMode: MoveUseMode.FOLLOW_UP });

        const ids = idsOf(bulbasaur.getRequiredAssets());

        expect(ids).toContain("texture:PRAS- Fly");
        expect(ids).toContain("audio:battle_anims/PRSFX- Fly");
      });
    });

    describe("fusions", () => {
      beforeEach(() => {
        game.override.enableStarterFusion().starterFusionSpecies(SpeciesId.CHARMANDER);
      });

      it("includes both halves' sprites and cries, and the textures the fusion palette is read from", async () => {
        await game.classicMode.startBattle(SpeciesId.ABRA);
        const fusion = game.field.getPlayerPokemon();

        const ids = idsOf(fusion.getRequiredAssets());

        expect(ids).toContain(`texture:${fusion.getFusionBattleSpriteKey(true, true)}`);
        expect(ids).toContain(`audio:${fusion.fusionSpecies!.getCryKey(fusion.fusionFormIndex)}`);
        for (const key of fusion["getFusionPaletteSpriteKeys"](true)) {
          expect(ids).toContain(`texture:${key}`);
        }
      });

      it("includes everything its loadAssets loads", async () => {
        await game.classicMode.startBattle(SpeciesId.ABRA);
        const fusion = game.field.getPlayerPokemon();

        const loaded = await getLoadedIds(fusion);

        expect(loaded.size).toBeGreaterThan(0);
        const required = idsOf(fusion.getRequiredAssets());
        for (const id of loaded) {
          expect(required).toContain(id);
        }
      });
    });

    it("includes both its own and its transformed appearance", async () => {
      await game.classicMode.startBattle(SpeciesId.DITTO);
      const ditto = game.field.getPlayerPokemon();
      const mew = game.field.getEnemyPokemon();

      game.move.use(MoveId.SPLASH);
      game.scene.phaseManager.unshiftNew("PokemonTransformPhase", ditto.getBattlerIndex(), mew.getBattlerIndex());
      await game.toEndOfTurn();
      expect(ditto.isTransformed()).toBe(true);

      const ids = idsOf(ditto.getRequiredAssets());

      expect(ids).toContain(`texture:${ditto.getSpriteKey(true)}`);
      expect(ids).toContain(`texture:${ditto.getSpriteKey(false)}`);
      expect(ids).toContain(`audio:${ditto.species.getCryKey(ditto.formIndex)}`);
      expect(ids).toContain(`audio:${mew.species.getCryKey(mew.formIndex)}`);
    });
  });

  describe("The run", () => {
    it("keeps the animation of a move called by Metronome until the end of the turn", async () => {
      game.override.moveset(MoveId.METRONOME);
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      fakeMoveAnim(MoveId.SWIFT, "Swift");
      game.move.forceMetronomeMove(MoveId.SWIFT);

      game.move.select(MoveId.METRONOME);
      await game.phaseInterceptor.to("TurnEndPhase", false);
      expect(idsOf(game.scene["getRequiredAssets"]())).toContain("texture:PRAS- Swift");

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(idsOf(game.scene["getRequiredAssets"]())).not.toContain("texture:PRAS- Swift");
    });

    it("keeps the animations of delayed attacks that haven't landed yet", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      fakeMoveAnim(MoveId.FUTURE_SIGHT, "Future Sight");
      game.scene.arena.positionalTagManager.addTag({
        tagType: PositionalTagType.DELAYED_ATTACK,
        sourceId: game.field.getPlayerPokemon().id,
        targetIndex: BattlerIndex.ENEMY,
        sourceMove: MoveId.FUTURE_SIGHT,
        turnCount: 3,
      });

      const ids = idsOf(game.scene["getRequiredAssets"]());

      expect(ids).toContain("texture:PRAS- Future Sight");
      expect(ids).toContain("audio:battle_anims/PRSFX- Future Sight");
    });
  });

  describe("Trainers", () => {
    it("include the partner's sprite in doubles", () => {
      const config = trainerConfigs[TrainerType.BREEDER];

      const ids = idsOf(config.getAssetRequests(TrainerVariant.DOUBLE));

      expect(ids).toEqual(
        new Set([`texture:${config.getSpriteKey(false, false)}`, `texture:${config.getSpriteKey(true, true)}`]),
      );
    });

    it("only include the trainer's own sprite when not in doubles", () => {
      const config = trainerConfigs[TrainerType.BREEDER];

      const ids = idsOf(config.getAssetRequests(TrainerVariant.FEMALE));

      expect(ids).toEqual(new Set([`texture:${config.getSpriteKey(true, false)}`]));
    });
  });

  describe("Mystery encounters", () => {
    it("include their declared assets and the exclamation bubble", () => {
      const ids = idsOf(new MysteryEncounter(PartTimerEncounter).getRequiredAssets());

      expect(ids).toContain("audio:battle_anims/PRSFX- Horn Drill1");
      expect(ids).toContain("audio:battle_anims/PRSFX- Aurora Veil2");
      expect(ids).toContain("audio:battle_anims/GEN8- Exclaim");
      expect(ids).toContain("texture:encounter_exclaim");
    });

    it("include the animations of moves loaded for the encounter", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      const encounter = new MysteryEncounter(PartTimerEncounter);
      game.scene.currentBattle.mysteryEncounter = encounter;
      fakeMoveAnim(MoveId.SNORE, "Snore");

      await loadCustomMovesForEncounter([MoveId.SNORE]);

      const ids = idsOf(encounter.getRequiredAssets());
      expect(ids).toContain("texture:PRAS- Snore");
      expect(ids).toContain("audio:battle_anims/PRSFX- Snore");
    });

    it("include their intro sprites, including ones changed after the encounter was built", async () => {
      await game.classicMode.startBattle(SpeciesId.BULBASAUR);
      const encounter = new MysteryEncounter(PartTimerEncounter);
      encounter.spriteConfigs = [{ spriteKey: "changed_in_on_init", fileRoot: "mystery-encounters" }];
      encounter.initIntroVisuals();

      const ids = idsOf(encounter.getRequiredAssets());

      expect(ids).toContain("texture:changed_in_on_init");
      expect(ids).not.toContain("texture:part_timer_crate");
    });
  });
});
