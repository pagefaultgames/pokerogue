import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Protosynthesis", () => {
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
      .moveset([MoveId.SPLASH, MoveId.TACKLE])
      .ability(AbilityId.PROTOSYNTHESIS)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not consider temporary items when determining which stat to boost", async () => {
    // Mew has uniform base stats
    game.override
      .startingModifier([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.DEF }])
      .enemyMoveset(MoveId.SUNNY_DAY)
      .startingLevel(100)
      .enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MEW]);
    const mew = game.field.getPlayerPokemon();
    // Nature of starting mon is randomized. We need to fix it to a neutral nature for the automated test.
    mew.setNature(Nature.HARDY);
    const enemy = game.field.getEnemyPokemon();
    const def_before_boost = mew.getEffectiveStat(
      Stat.DEF,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      false,
      true,
    );
    const atk_before_boost = mew.getEffectiveStat(
      Stat.ATK,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      false,
      true,
    );
    const initialHp = enemy.hp;
    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();
    const unboosted_dmg = initialHp - enemy.hp;
    enemy.hp = initialHp;
    const def_after_boost = mew.getEffectiveStat(
      Stat.DEF,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      false,
      true,
    );
    const atk_after_boost = mew.getEffectiveStat(
      Stat.ATK,
      undefined,
      undefined,
      false,
      undefined,
      undefined,
      false,
      false,
      true,
    );
    game.move.select(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();
    const boosted_dmg = initialHp - enemy.hp;
    expect(boosted_dmg).toBeGreaterThan(unboosted_dmg);
    expect(def_after_boost).toEqual(def_before_boost);
    expect(atk_after_boost).toBeGreaterThan(atk_before_boost);
  });
});
