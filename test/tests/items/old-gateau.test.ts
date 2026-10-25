import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { PERMANENT_STATS, Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Old Gateau", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .startingHeldItems([{ entry: HeldItemId.OLD_GATEAU }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should add +20 base stats to the lower stat of each pair (HP/SPD, ATK/SPATK, DEF/SPDEF)", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const formBaseStats = player.getSpeciesForm(true).baseStats;
    const expectedStats = [
      formBaseStats[Stat.HP] < formBaseStats[Stat.SPD] ? Stat.HP : Stat.SPD,
      formBaseStats[Stat.ATK] < formBaseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK,
      formBaseStats[Stat.DEF] < formBaseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF,
    ];

    const baseStats = formBaseStats.slice();
    applySingleHeldItem(HeldItemId.OLD_GATEAU, HeldItemEffect.BASE_STAT_ADD, { pokemon: player, baseStats });

    for (const s of PERMANENT_STATS) {
      expect(baseStats[s]).toBe(expectedStats.includes(s) ? formBaseStats[s] + 20 : formBaseStats[s]);
    }
  });
});
