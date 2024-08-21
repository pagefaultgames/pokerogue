import { allMoves, MoveCategory } from "#app/data/move";
import GameManager from "#test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Abilities } from "#app/enums/abilities";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Type } from "#app/data/type";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BattleStat } from "#app/data/battle-stat";
import { Stat } from "#app/enums/stat";

describe("Moves - Tera Blast", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const moveToCheck = allMoves[Moves.TERA_BLAST];

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
      .battleType("single")
      .disableCrits()
      .starterSpecies(Species.FEEBAS)
      .moveset([Moves.TERA_BLAST])
      .ability(Abilities.BALL_FETCH)
      .startingHeldItems([{name: "TERA_SHARD", type: Type.FIRE}])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyLevel(20);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match user's tera type", async() => {

    await game.startBattle([Species.CHIKORITA]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TERA_BLAST));

    expect(moveToCheck.type).toBe(Type.FIRE);
  }, 20000);

  it("increases power if user is Stellar tera type", async() => {
    game.override.startingHeldItems([{name: "TERA_SHARD", type: Type.STELLAR}]);
    const stellarTypeMultiplier = 2;
    const stellarTypeDmgBonus = 20;
    const basePower = moveToCheck.power;

    await game.startBattle([Species.CHIKORITA]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TERA_BLAST));

    expect(moveToCheck.calculateBattlePower).toBe((basePower + stellarTypeDmgBonus) * stellarTypeMultiplier);
  }, 20000);

  it("uses the higher stat of the user's Atk and SpAtk for damage calculation", async() => {
    await game.startBattle([Species.CHIKORITA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 100;
    playerPokemon.stats[Stat.SPATK] = 0;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TERA_BLAST));

    expect(moveToCheck.category).toBe(MoveCategory.PHYSICAL);

  }, 20000);

  it("causes stat drops if user is Stellar tera type", async() => {
    game.override.startingHeldItems([{name: "TERA_SHARD", type: Type.STELLAR}]);
    await game.startBattle([Species.CHIKORITA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.doAttack(getMovePosition(game.scene, 0, Moves.TERA_BLAST));

    expect(playerPokemon[0].summonData.battleStats[BattleStat.SPATK, BattleStat.ATK]).toBe(-1);

  }, 20000);
});
