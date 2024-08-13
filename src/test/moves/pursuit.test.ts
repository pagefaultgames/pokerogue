import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { SPLASH_ONLY } from "../utils/testUtils";
import { allMoves } from "#app/data/move.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase } from "#app/phases.js";
import Pokemon, { MoveResult } from "#app/field/pokemon.js";
import { BattleStat } from "#app/data/battle-stat.js";

interface PokemonAssertionChainer {
  and(expectation: (p?: Pokemon) => PokemonAssertionChainer): PokemonAssertionChainer;
}

function chain(pokemon?: Pokemon): PokemonAssertionChainer {
  return {
    and: (expectation) => {
      return expectation(pokemon);
    }
  };
}

describe("Moves - Pursuit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const pursuitMoveDef = allMoves[Moves.PURSUIT];

  const playerLead = Species.BULBASAUR;
  const enemyLead = Species.KANGASKHAN;

  function startBattle() {
    return game.startBattle([playerLead, Species.RAICHU, Species.ABSOL]);
  }

  function runCombatTurn() {
    return game.phaseInterceptor.to(BerryPhase, false);
  }

  function playerUsesPursuit(pokemonIndex: 0 | 1 = 0) {
    game.doAttack(getMovePosition(game.scene, pokemonIndex, Moves.PURSUIT));
  }

  function playerUsesSwitchMove(pokemonIndex: 0 | 1 = 0, move: Moves.U_TURN | Moves.BATON_PASS | Moves.TELEPORT = Moves.U_TURN) {
    game.doAttack(getMovePosition(game.scene, pokemonIndex, move));
    game.doSelectPartyPokemon(2);
  }

  function playerSwitches(pokemonIndex: number = 1) {
    game.doSwitchPokemon(pokemonIndex);
  }

  function enemyUses(move: Moves) {
    game.override.enemyMoveset(move);
  }

  function enemySwitches() {
    game.override.forceTrainerSwitches();
  }

  function forceMovesLast(pokemon?: Pokemon) {
    pokemon!.summonData.battleStats[BattleStat.SPD] = -6;
  }

  function expectPursuitPowerDoubled() {
    expect(pursuitMoveDef.calculateBattlePower).toHaveReturnedWith(80);
  }

  function expectPursuitPowerUnchanged() {
    expect(pursuitMoveDef.calculateBattlePower).toHaveReturnedWith(40);
  }

  function expectPursuitFailed(pokemon?: Pokemon) {
    const lastMove = pokemon!.getLastXMoves(0)[0];
    expect(lastMove.result).toBe(MoveResult.FAIL);
    return chain(pokemon);
  }

  function expectWasHit(pokemon?: Pokemon) {
    expect(pokemon!.hp).toBeLessThan(pokemon!.getMaxHp());
    return chain(pokemon);
  }

  function expectWasNotHit(pokemon?: Pokemon) {
    expect(pokemon!.hp).toBe(pokemon!.getMaxHp());
    return chain(pokemon);
  }

  function expectNotOnField(pokemon?: Pokemon) {
    expect(pokemon!.isOnField()).toBe(false);
    return chain(pokemon);
  }

  function expectHasFled(pokemon?: Pokemon) {
    expect(pokemon!.wildFlee).toBe(true);
    return chain(pokemon);
  }

  function findPartyMember(party: Pokemon[], species: Species) {
    return party.find(pkmn => pkmn.species.speciesId === species);
  }

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
      .enemyParty([enemyLead, Species.SNORLAX, Species.BASCULIN])
      .startingLevel(20)
      .startingWave(25)
      .moveset([Moves.PURSUIT, Moves.U_TURN, Moves.BATON_PASS, Moves.TELEPORT])
      .enemyMoveset(SPLASH_ONLY)
      .disableCrits();

    vi.spyOn(pursuitMoveDef, "calculateBattlePower");
  });

  it("should hit for normal power if the target is not switching", async () => {
    // arrange
    await startBattle();

    // act
    playerUsesPursuit();
    await runCombatTurn();

    // assert
    expectPursuitPowerUnchanged();
    expectWasHit(game.scene.getEnemyPokemon());
  });

  it("should hit a hard-switching target for double power (player attacks, enemy switches)", async () => {
    // arrange
    await startBattle();

    // act
    playerUsesPursuit();
    enemySwitches();
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasNotHit(game.scene.getEnemyPokemon());
    expectNotOnField(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectWasHit);
  });

  it("should hit a hard-switching target for double power (player switches, enemy attacks)", async () => {
    // arrange
    await startBattle();

    // act
    playerSwitches();
    enemyUses(Moves.PURSUIT);
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasNotHit(game.scene.getPlayerPokemon());
    expectNotOnField(findPartyMember(game.scene.getParty(), playerLead))
      .and(expectWasHit);
  });

  it("should hit an outgoing uturning target if pursuiter has not moved yet (player attacks, enemy switches)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasNotHit(game.scene.getEnemyPokemon());
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectNotOnField);
  });

  it("should hit an outgoing uturning target if pursuiter has not moved yet (player switches, enemy attacks)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getEnemyPokemon());

    // act
    playerUsesSwitchMove();
    enemyUses(Moves.PURSUIT);
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasNotHit(game.scene.getPlayerPokemon());
    expectWasHit(findPartyMember(game.scene.getParty(), playerLead))
      .and(expectNotOnField);
  });

  it("should bypass accuracy checks when hitting a hard-switching target", async () => {
    // arrange
    await startBattle();
    game.scene.getPlayerPokemon()!.summonData.battleStats[BattleStat.ACC] = -6;
    game.scene.getEnemyPokemon()!.summonData.battleStats[BattleStat.EVA] = 6;

    // act
    playerUsesPursuit();
    enemySwitches();
    await runCombatTurn();

    // assert
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
  });

  it("should bypass accuracy checks when hitting a uturning target", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getEnemyPokemon()!.summonData.battleStats[BattleStat.ACC] = -6;
    game.scene.getPlayerPokemon()!.summonData.battleStats[BattleStat.EVA] = 6;

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
  });

  it("should not hit a baton pass user", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getEnemyPokemon()!.summonData.battleStats[BattleStat.ACC] = -6;
    game.scene.getPlayerPokemon()!.summonData.battleStats[BattleStat.EVA] = 6;

    // act
    playerUsesPursuit();
    enemyUses(Moves.BATON_PASS);
    await runCombatTurn();

    // assert
    expectPursuitPowerUnchanged();
    expectWasHit(game.scene.getEnemyPokemon());
    expectWasNotHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectNotOnField);
  });

  it("should not hit a teleport user", () => async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    vi.spyOn(pursuitMoveDef, "priority", "get").mockReturnValue(-6);

    // act
    playerUsesPursuit();
    enemyUses(Moves.TELEPORT);
    await runCombatTurn();

    // assert
    expectPursuitPowerUnchanged();
    expectWasHit(game.scene.getEnemyPokemon());
    expectWasNotHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectNotOnField);
  });

  it("should not hit a fleeing wild pokemon", async () => {
    // arrange
    game.override
      .startingWave(24)
      .disableTrainerWaves();
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectPursuitFailed(game.scene.getPlayerPokemon());
    expectWasNotHit(game.scene.getEnemyParty()[0])
      .and(expectHasFled);
  });

  it.todo("should not hit a switch move user for double damage if the switch move fails and does not switch out the user");

  it.todo("triggers contact abilities on the pokemon that is switching out (hard-switch)");

  it.todo("triggers contact abilities on the pokemon that is switching out (switch move, player switching)");

  it.todo("triggers contact abilities on the pokemon that is switching out (switch move, enemy switching)");

  it.todo("should bypass follow me when hitting a switching target");

  it.todo("should bypass substitute when hitting an escaping target");

  it.todo("should hit a grounded, switching target under Psychic Terrain");

  describe("doubles interactions", () => {
    it.todo("should fail if both pokemon use pursuit on a target that is switching out and it faints after the first one");

    it.todo("should not hit a pokemon being forced out with dragon tail");

    it.todo("should not hit a uturning target for double power if the pursuiter moves before the uturner");

    it.todo("should hit the first pokemon to switch out in a double battle regardless of who was targeted");

    it.todo("should not hit both pokemon in a double battle if both switch out");

    it.todo("should not hit a switching ally (hard-switch, player field)");

    it.todo("should not hit a switching ally (hard-switch, enemy field)");

    it.todo("should not hit a switching ally (switch move, player field)");

    it.todo("should not hit a switching ally (switch move, enemy field)");
  });
});
