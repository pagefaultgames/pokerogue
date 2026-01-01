/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Raging Bull", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.REFLECT, tagName: "Reflect" },
    { tagType: ArenaTagType.LIGHT_SCREEN, tagName: "Light Screen" },
    { tagType: ArenaTagType.AURORA_VEIL, tagName: "Aurora Veil" },
  ])("should remove $tagName only from the target's side of the field", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);

    game.move.use(MoveId.RAGING_BULL);
    await game.toEndOfTurn();

    expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.REFLECT, tagName: "Reflect" },
    { tagType: ArenaTagType.LIGHT_SCREEN, tagName: "Light Screen" },
    { tagType: ArenaTagType.AURORA_VEIL, tagName: "Aurora Veil" },
  ])("should remove $tagName from the target's side even if the target is an ally", async ({ tagType }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);

    game.move.use(MoveId.RAGING_BULL, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
  });

  it.each<{ speciesId: SpeciesId; formIndex?: number; moveType: PokemonType; testString: string }>([
    { speciesId: SpeciesId.TAUROS, moveType: PokemonType.NORMAL, testString: "Kantonian Tauros - Normal" },
    {
      speciesId: SpeciesId.PALDEA_TAUROS,
      formIndex: 0,
      moveType: PokemonType.FIGHTING,
      testString: "Paldean Tauros Combat Breed - Fighting",
    },
    {
      speciesId: SpeciesId.PALDEA_TAUROS,
      formIndex: 1,
      moveType: PokemonType.FIRE,
      testString: "Paldean Tauros Blaze Breed - Fire",
    },
    {
      speciesId: SpeciesId.PALDEA_TAUROS,
      formIndex: 2,
      moveType: PokemonType.WATER,
      testString: "Paldean Tauros Aqua Breed - Water",
    },
  ])("should change type based on the user ($testString)", async ({ speciesId, formIndex, moveType }) => {
    if (formIndex != null) {
      game.override.starterForms({ [SpeciesId.PALDEA_TAUROS]: formIndex });
    }
    await game.classicMode.startBattle([speciesId]);

    expect(game.field.getPlayerPokemon().getMoveType(allMoves[MoveId.RAGING_BULL])).toBe(moveType);
  });
});
