/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerType } from "#enums/trainer-type";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/** Check that `pokemon` received the stat changes from non-Ghost-type Curse (+1 ATK/DEF, -1 SPD). */
function expectCurseStatChanges(pokemon: Pokemon): void {
  expect(pokemon).toHaveStatStage(Stat.ATK, 1);
  expect(pokemon).toHaveStatStage(Stat.DEF, 1);
  expect(pokemon).toHaveStatStage(Stat.SPD, -1);
}

describe("Move - Curse", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.CURSE, MoveId.SPLASH])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should give +1 ATK/DEF, -1 SPD when used by non-Ghost types", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn();

    expectCurseStatChanges(player);
    expect(player).toHaveFullHp();
    expect(enemy).toHaveFullHp();
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(game).not.toHaveShownMessage(
      i18next.t("battlerTags:cursedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(player),
        pokemonName: getPokemonNameWithAffix(enemy),
      }),
    );
  });

  it("should sacrifice 50% maximum HP if Ghost-type to add a CurseTag to the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    player.summonData.types = [PokemonType.GHOST];

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(enemy).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player.getHpRatio(true)).toBeCloseTo(0.5);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:cursedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(player),
        pokemonName: getPokemonNameWithAffix(enemy),
      }),
    );
  });

  // NB: Tests for the curse tag actually _doing damage_ are inside
  // `test/battler-tags/damage-over-time.ts`

  it("should curse the target if Tera Ghost", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    game.field.forceTera(player, PokemonType.GHOST);

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(enemy).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
  });

  it("should ignore Tera Stellar and Curse the opponent", async () => {
    await game.classicMode.startBattle(SpeciesId.SHUPPET);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    game.field.forceTera(player, PokemonType.STELLAR);

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(enemy).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player.getHpRatio(true)).toBeCloseTo(0.5);
  });

  // https://github.com/pagefaultgames/pokerogue/issues/6829
  it("should curse the opponent if used on the same turn as Terastallizing into a Ghost type", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    player.teraType = PokemonType.GHOST;

    game.move.selectWithTera(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(player.isTerastallized).toBe(true);
    expect(enemy).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).toHaveStatStage(Stat.ATK, 0);
  });

  it("should give +1 ATK/DEF, -1 SPD if used on the same turn as a Ghost type Terastallizing into a non-Ghost type", async () => {
    await game.classicMode.startBattle(SpeciesId.SHUPPET);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    player.teraType = PokemonType.NORMAL;

    game.move.selectWithTera(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(player.isTerastallized).toBe(true);
    expectCurseStatChanges(player);
    expect(player).toHaveFullHp();
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.CURSED);
  });

  it.each([
    { pick: "first", roll: () => 0 },
    { pick: "last", roll: (range: number) => range - 1 },
  ])(
    "should curse a random opponent, never the ally, if used on the same turn as Terastallizing into a Ghost type in a double battle ($pick candidate)",
    async ({ roll }) => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

      const [player, ally] = game.scene.getPlayerField();
      const enemies = game.scene.getEnemyField();
      player.teraType = PokemonType.GHOST;
      // Force the user's random target pick to the first or last candidate
      vi.spyOn(player, "randBattleSeedInt").mockImplementation(roll);

      game.move.selectWithTera(MoveId.CURSE, BattlerIndex.PLAYER);
      game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      expect(enemies.filter(enemy => enemy.getTag(BattlerTagType.CURSED))).toHaveLength(1);
      expect(ally).not.toHaveBattlerTag(BattlerTagType.CURSED);
      expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    },
  );

  it("should fail if used on the same turn as Terastallizing into a Ghost type with no opponent on the field", async () => {
    // The opponent faints from Memento before the user moves, and its replacement isn't sent out until the end of the turn
    game.override.battleType(BattleType.TRAINER).randomTrainer({ trainerType: TrainerType.YOUNGSTER });
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    player.teraType = PokemonType.GHOST;

    game.move.selectWithTera(MoveId.CURSE);
    await game.move.forceEnemyMove(MoveId.MEMENTO);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(enemy).toHaveFainted();
    expect(player).toHaveUsedMove({ move: MoveId.CURSE, result: MoveResult.FAIL });
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).toHaveFullHp();
  });

  // Only Terastallizing is confirmed on cartridge (see #6829);
  // these assume other type changes before the user moves work the same way
  it("should curse the opponent if the user becomes a Ghost type from Trick-or-Treat before it moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.CURSE);
    await game.move.forceEnemyMove(MoveId.TRICK_OR_TREAT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(player.isOfType(PokemonType.GHOST)).toBe(true);
    expect(enemy).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).toHaveStatStage(Stat.ATK, 0);
  });

  it("should give +1 ATK/DEF, -1 SPD if the user loses the Ghost type from Soak before it moves", async () => {
    await game.classicMode.startBattle(SpeciesId.SHUPPET);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.CURSE);
    await game.move.forceEnemyMove(MoveId.SOAK);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(player.isOfType(PokemonType.GHOST)).toBe(false);
    expectCurseStatChanges(player);
    expect(player).toHaveFullHp();
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.CURSED);
  });

  it.each([
    { name: "Protean", ability: AbilityId.PROTEAN },
    { name: "Libero", ability: AbilityId.LIBERO },
  ])("should curse the user if it becomes a Ghost type from $name", async ({ ability }) => {
    game.override.ability(ability);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(player.isOfType(PokemonType.GHOST)).toBe(true);
    expect(player).toHaveUsedMove({ move: MoveId.CURSE, result: MoveResult.SUCCESS });
    expect(player).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(player).toHaveStatStage(Stat.ATK, 0);
    expect(enemy).not.toHaveBattlerTag(BattlerTagType.CURSED);
  });
});
