import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";

describe("Move - Court Change", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .criticalHits(false)
      .enemyAbility(AbilityId.STURDY)
      .startingLevel(100)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should swap the pledge effect to the opposite side ", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.SHUCKLE]);
    const regieleki = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.WATER_PLEDGE);
    game.move.use(MoveId.GRASS_PLEDGE, 1);
    await game.toNextTurn();

    // enemy team will be in the swamp and slowed
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(enemyPokemon.getStat(Stat.SPD) / 4);

    game.move.use(MoveId.COURT_CHANGE);
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();
    // own team should now be in the swamp and slowed
    expect(regieleki.getEffectiveStat(Stat.SPD)).toBe(regieleki.getStat(Stat.SPD) / 4);
  });

  it("should swap safeguard to the enemy side ", async () => {
    game.override.enemyMoveset(MoveId.TOXIC_THREAD);
    await game.classicMode.startBattle([SpeciesId.NINJASK]);
    const ninjask = game.field.getPlayerPokemon();

    game.move.use(MoveId.SAFEGUARD);
    await game.toNextTurn();

    // Ninjask will not be poisoned because of Safeguard
    expect(ninjask.status?.effect).not.toBe(StatusEffect.POISON);

    game.move.use(MoveId.COURT_CHANGE);
    await game.toEndOfTurn();

    // Ninjask should now be poisoned due to lack of Safeguard
    expect(ninjask.status?.effect).toBe(StatusEffect.POISON);
  });
});
