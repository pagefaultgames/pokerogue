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
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .battleStyle("double")
      .enemyLevel(100);
  });

  it("Court Change should swap the swamp from the enemy to the own teams side ", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.SHUCKLE]);
    const [regieleki, shuckle] = game.scene.getPlayerParty();
    game.move.changeMoveset(regieleki, [MoveId.WATER_PLEDGE, MoveId.COURT_CHANGE, MoveId.SPLASH]);
    game.move.changeMoveset(shuckle, [MoveId.GRASS_PLEDGE, MoveId.COURT_CHANGE, MoveId.SPLASH]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.use(MoveId.WATER_PLEDGE, 0);
    game.move.use(MoveId.GRASS_PLEDGE, 1);
    await game.toEndOfTurn();

    //enemy team will be in the swamp and slowed
    expect(enemyPokemon.getEffectiveStat(Stat.SPD)).toBe(enemyPokemon.getStat(Stat.SPD) >> 2);

    game.move.use(MoveId.COURT_CHANGE, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.toEndOfTurn();

    //own team should now be in the swamp and slowed

    expect(regieleki.getEffectiveStat(Stat.SPD)).toBe(regieleki.getStat(Stat.SPD) >> 2);
  });

  it("Court Change should swap safeguard to the enemy side ", async () => {
    game.override.battleStyle("single").enemySpecies(SpeciesId.GRIMER).enemyMoveset(MoveId.TOXIC_THREAD);
    await game.classicMode.startBattle([SpeciesId.NINJASK]);
    const [ninjask] = game.scene.getPlayerParty();
    game.move.changeMoveset(ninjask, [MoveId.SAFEGUARD, MoveId.COURT_CHANGE, MoveId.NUZZLE, MoveId.SPLASH]);

    game.move.use(MoveId.SAFEGUARD, 0);
    await game.toEndOfTurn();

    //Ninjask will not be poisoned because of Safeguard
    expect(ninjask.status?.effect).not.toBe(StatusEffect.POISON);

    game.move.use(MoveId.COURT_CHANGE);
    await game.toEndOfTurn();

    //Ninjask should now be poisoned
    expect(ninjask.status?.effect).toBe(StatusEffect.POISON);
  });
});
