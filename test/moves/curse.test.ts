/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should give +1 ATK/DEF, -1 SPD when used by non-Ghost types", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(feebas).toHaveStatStage(Stat.ATK, 1);
    expect(feebas).toHaveStatStage(Stat.DEF, 1);
    expect(feebas).toHaveStatStage(Stat.SPD, -1);
    expect(feebas).toHaveFullHp();
    expect(karp).toHaveFullHp();
    expect(karp).not.toHaveBattlerTag(BattlerTagType.CURSED);
    expect(game).not.toHaveShownMessage(
      i18next.t("battlerTags:cursedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
        pokemonName: getPokemonNameWithAffix(karp),
      }),
    );
  });

  it("should sacrifice 50% maximum HP if Ghost-type to add a CurseTag to the target", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    feebas.summonData.types = [PokemonType.GHOST];

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(feebas.getHpRatio(true)).toBeCloseTo(0.5);
    expect(karp).toHaveBattlerTag(BattlerTagType.CURSED);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:cursedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
        pokemonName: getPokemonNameWithAffix(karp),
      }),
    );
    // NB: Tests for the curse tag actually _doing damage_ are inside
    // `test/battler-tags/damage-over-time.ts`
  });

  it("should curse the target if Tera Ghost", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    game.field.forceTera(feebas, PokemonType.GHOST);

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(feebas.getHpRatio(true)).toBeCloseTo(0.5);
    expect(karp).toHaveBattlerTag(BattlerTagType.CURSED);
  });

  it("should respect Tera Stellar and Curse the opponent", async () => {
    await game.classicMode.startBattle(SpeciesId.SHUPPET);

    const shuppet = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    game.field.forceTera(shuppet, PokemonType.STELLAR);

    game.move.use(MoveId.CURSE);
    await game.toEndOfTurn(false);

    expect(shuppet.getHpRatio(true)).toBeCloseTo(0.5);
    expect(karp).toHaveBattlerTag(BattlerTagType.CURSED);
  });
});
