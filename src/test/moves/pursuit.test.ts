import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { TerrainType } from "#app/data/terrain";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import Pokemon, { MoveResult } from "#app/field/pokemon";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

interface PokemonAssertionChainer {
  and(expectation: (p?: Pokemon) => PokemonAssertionChainer): PokemonAssertionChainer;
  and(expectation: (p?: Pokemon) => void): void
}

function chain(pokemon?: Pokemon): PokemonAssertionChainer {
  return {
    and: (expectation) => {
      return expectation(pokemon);
    }
  };
}

function toArray<T>(a?: T | T[]) {
  return Array.isArray(a) ? a : [a!];
}

describe("Moves - Pursuit", { timeout: 10000 }, () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const pursuitMoveDef = allMoves[Moves.PURSUIT];

  const playerLead = Species.MUDSDALE;
  const enemyLead = Species.KANGASKHAN;

  function startBattle() {
    return game.startBattle([playerLead, Species.RAICHU, Species.ABSOL]);
  }

  /**
   * Many of these tests can't run only to {@linkcode BerryPhase} because of interactions with fainting
   * during switches. We need to run tests all the way through to the start of the next turn
   * to ensure that, for example, the game doesn't attempt to switch two pokemon into the same
   * slot (once in the originally queued summon phase, and the next as a result of {@linkcode FaintPhase})
   * @param to Phase to run to (default {@linkcode TurnInitPhase})
   */
  async function runCombatTurn(to: string = "TurnInitPhase"): Promise<void> {
    return await game.phaseInterceptor.to(to, false);
  }

  function afterFirstSwitch(action: () => void) {
    game.phaseInterceptor.onNextPhase(EnemyCommandPhase, () =>
      game.phaseInterceptor.advance().then(action));
  }

  function playerDoesNothing() {
    game.override.moveset(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    if (game.scene.currentBattle.double) {
      game.move.select(Moves.SPLASH, 1);
    }
  }

  function playerUsesPursuit(pokemonIndex: 0 | 1 = 0, targetIndex: BattlerIndex = BattlerIndex.ENEMY) {
    game.move.select(Moves.PURSUIT, pokemonIndex, targetIndex);
  }

  function playerUsesSwitchMove(pokemonIndex: 0 | 1 = 0) {
    game.move.select(Moves.U_TURN, pokemonIndex);
    game.doSelectPartyPokemon(2);
  }

  function playerSwitches(pokemonIndex: number = 1) {
    game.doSwitchPokemon(pokemonIndex);
  }

  function enemyUses(move: Moves) {
    game.override.enemyMoveset(move);
  }

  function enemySwitches(once?: boolean) {
    game.override.forceTrainerSwitches();
    if (once) {
      afterFirstSwitch(() => game.override.forceTrainerSwitches(false));
    }
  }

  function forceMovesLast(pokemon?: Pokemon | Pokemon[]) {
    pokemon = toArray(pokemon);
    const otherPkmn = game.scene.getField().filter(p => p && !pokemon.find(p1 => p1 === p));
    const moveOrder = ([...otherPkmn, ...pokemon].map(pkmn => pkmn.getBattlerIndex()));

    game.phaseInterceptor.onNextPhase(TurnStartPhase, p => {
      vi.spyOn(p, "getCommandOrder").mockReturnValue(
          // TurnStartPhase crashes if a BI returned by getOrder() is fainted.
          // not an issue normally but some of the test setups can cause this
          moveOrder!.filter(i => game.scene.getField(false)[i]?.isActive(true))
      );
    });
  }

  function forceMovesFirst(pokemon?: Pokemon | Pokemon[]) {
    pokemon = toArray(pokemon);
    const otherPkmn = game.scene.getField().filter(p => p && !pokemon.find(p1 => p1 === p));
    const moveOrder = ([...pokemon, ...otherPkmn].map(pkmn => pkmn.getBattlerIndex()));

    game.phaseInterceptor.onNextPhase(TurnStartPhase, p => {
      vi.spyOn(p, "getCommandOrder").mockReturnValue(
          // TurnStartPhase crashes if a BI returned by getOrder() is fainted.
          // not an issue normally but some of the test setups can cause this
          moveOrder!.filter(i => game.scene.getField(false)[i]?.isActive(true))
      );
    });
  }

  function forceLowestPriorityBracket() {
    vi.spyOn(pursuitMoveDef, "priority", "get").mockReturnValue(-6);
  }

  function expectPursuitPowerDoubled() {
    expect(pursuitMoveDef.calculateBattlePower).toHaveReturnedWith(80);
  }

  function expectPursuitPowerUnchanged() {
    expect(pursuitMoveDef.calculateBattlePower).toHaveReturnedWith(40);
  }

  function expectPursuitSucceeded(pokemon?: Pokemon) {
    const lastMove = pokemon!.getLastXMoves(0)[0];
    expect(lastMove.move).toBe(Moves.PURSUIT);
    expect(lastMove.result).toBe(MoveResult.SUCCESS);
    return chain(pokemon);
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

  function expectOnField(pokemon?: Pokemon) {
    expect(pokemon!.isOnField()).toBe(true);
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

  function expectIsSpecies(species: Species) {
    return (pokemon?: Pokemon) => {
      expect(pokemon!.species.speciesId).toBe(species);
      return chain(pokemon);
    };
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
      .enemyParty([enemyLead, Species.SNORLAX, Species.BASCULIN, Species.ALCREMIE])
      .startingLevel(20)
      .startingWave(25)
      .moveset([Moves.PURSUIT, Moves.U_TURN, Moves.DRAGON_TAIL, Moves.FOLLOW_ME])
      .enemyMoveset(Moves.SPLASH)
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

  it("should not hit a uturning target for double power if the pursuiter moves before the uturner", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getEnemyPokemon());

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectPursuitPowerUnchanged();
    expectWasNotHit(game.scene.getEnemyPokemon());
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectNotOnField);
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
    game.scene.getPlayerPokemon()!.summonData.statStages[Stat.ACC] = -6;
    game.scene.getEnemyPokemon()!.summonData.statStages[Stat.EVA] = 6;

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
    game.scene.getEnemyPokemon()!.summonData.statStages[Stat.ACC] = -6;
    game.scene.getPlayerPokemon()!.summonData.statStages[Stat.EVA] = 6;

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
  });

  it.todo("should bypass substitute when hitting an escaping target (hard switch)");

  it.todo("should bypass substitute when hitting an escaping target (switch move)");

  it.todo("should not bypass substitute when hitting a non-escaping target");

  it("should hit a grounded, switching target under Psychic Terrain (switch move)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.arena.trySetTerrain(TerrainType.PSYCHIC, false, true);

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
  });

  it("should hit a grounded, switching target under Psychic Terrain (hard-switch)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.arena.trySetTerrain(TerrainType.PSYCHIC, false, true);

    // act
    playerUsesPursuit();
    enemySwitches();
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
  });

  it("should not hit a baton pass user", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getEnemyPokemon()!.summonData.statStages[Stat.ACC] = -6;
    game.scene.getPlayerPokemon()!.summonData.statStages[Stat.EVA] = 6;

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
    forceLowestPriorityBracket();

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
    await runCombatTurn("BerryPhase");

    // assert
    expectPursuitFailed(game.scene.getPlayerPokemon());
    expectWasNotHit(game.scene.getEnemyParty()[0])
      .and(expectHasFled);
  });

  it("should not hit a switch move user for double damage if the switch move fails and does not switch out the user", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());

    // act
    playerUsesPursuit();
    enemyUses(Moves.VOLT_SWITCH);
    await runCombatTurn();

    // assert
    expectPursuitPowerUnchanged();
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectOnField);
    expectWasNotHit(findPartyMember(game.scene.getParty(), playerLead));
  });

  it("triggers contact abilities on the pokemon that is switching out (hard-switch)", async () => {
    // arrange
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());

    // act
    playerUsesPursuit();
    enemySwitches();
    await runCombatTurn();

    // assert
    expectPursuitPowerDoubled();
    expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead));
    expectWasHit(game.scene.getPlayerPokemon());
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });

  it("triggers contact abilities on the pokemon that is switching out (switch move, player switching)", async () => {
    // arrange
    game.override.ability(Abilities.STAMINA);
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());

    // act
    playerUsesSwitchMove();
    enemyUses(Moves.PURSUIT);
    await runCombatTurn();

    // assert
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });

  it("triggers contact abilities on the pokemon that is switching out (switch move, enemy switching)", async () => {
    // arrange
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await startBattle();
    forceMovesLast(game.scene.getEnemyPokemon());

    // act
    playerUsesSwitchMove();
    enemySwitches();
    await runCombatTurn();

    // assert
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
  });

  it("should not have a pokemon fainted by a switch move pursue its killer", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getPlayerPokemon()!.hp = 1;

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expect(game.scene.getParty()[0]!.isFainted()).toBe(true);
    expectWasNotHit(findPartyMember(game.scene.getEnemyParty(), enemyLead))
      .and(expectNotOnField);
  });

  it("should not cause two pokemon to enter the field if a switching-out pokemon is fainted by pursuit (hard-switch, enemy faints)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getEnemyPokemon()!.hp = 1;

    // act
    playerUsesPursuit();
    enemySwitches();
    await runCombatTurn();

    // assert
    expect(game.scene.getEnemyParty().filter(p => p.isOnField())).toHaveLength(1);
  });

  it("should not cause two pokemon to enter the field if a switching-out pokemon is fainted by pursuit (u-turn, enemy faints)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getPlayerPokemon());
    game.scene.getEnemyPokemon()!.hp = 1;

    // act
    playerUsesPursuit();
    enemyUses(Moves.U_TURN);
    await runCombatTurn();

    // assert
    expect(game.scene.getEnemyParty().filter(p => p.isOnField())).toHaveLength(1);
  });

  it("should not cause two pokemon to enter the field or a premature switch if a switching-out pokemon is fainted by pursuit (hard-switch, player faints)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getEnemyPokemon());
    game.scene.getPlayerPokemon()!.hp = 1;

    // act
    playerSwitches();
    enemyUses(Moves.PURSUIT);
    await runCombatTurn("TurnEndPhase");

    // assert
    expect(game.scene.getParty().filter(p => p.isOnField())).toHaveLength(1);
    // SwitchPhase for fainted pokemon happens after TurnEndPhase - if we
    // skipped the uturn switch, we shouldn't have executed a switchout by this point
    expect(game.scene.getPlayerField()[0]?.isFainted()).toBeTruthy();
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });

  it("should not cause two pokemon to enter the field or a premature switch if a switching-out pokemon is fainted by pursuit (u-turn, player faints)", async () => {
    // arrange
    await startBattle();
    forceMovesLast(game.scene.getEnemyPokemon());
    game.scene.getPlayerPokemon()!.hp = 1;

    // act
    playerUsesSwitchMove();
    enemyUses(Moves.PURSUIT);
    await runCombatTurn("TurnEndPhase");

    // assert
    expect(game.scene.getParty().filter(p => p.isOnField())).toHaveLength(1);
    // SwitchPhase for fainted pokemon happens after TurnEndPhase - if we
    // skipped the uturn switch, we shouldn't have executed a switchout by this point
    expect(game.scene.getPlayerField()[0]?.isFainted()).toBeTruthy();
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });

  describe("doubles interactions", () => {
    beforeEach(() => {
      game.override
        .battleType("double")
        .enemyMoveset([Moves.PURSUIT, Moves.U_TURN]);
    });

    it("should bypass follow me when hitting a switching target", async () => {
      await startBattle();
      forceMovesLast(game.scene.getEnemyPokemon());

      game.move.select(Moves.FOLLOW_ME);
      playerUsesSwitchMove(1);
      game.forceEnemyMove(Moves.PURSUIT, BattlerIndex.PLAYER_2);
      await game.killPokemon(game.scene.getEnemyField()[1]);
      await runCombatTurn();

      expectPursuitPowerDoubled();
      expectWasHit(findPartyMember(game.scene.getParty(), Species.RAICHU))
        .and(expectNotOnField);
      expectWasNotHit(findPartyMember(game.scene.getParty(), playerLead));
    });

    it("should not bypass follow me when hitting a non-switching target", async () => {
      await startBattle();
      forceMovesLast(game.scene.getEnemyPokemon());

      game.override.moveset([Moves.FOLLOW_ME, Moves.SPLASH]);
      game.move.select(Moves.FOLLOW_ME);
      game.move.select(Moves.SPLASH, 1);
      game.forceEnemyMove(Moves.PURSUIT, BattlerIndex.PLAYER_2);
      await game.killPokemon(game.scene.getEnemyField()[1]);
      await runCombatTurn();

      expectPursuitPowerUnchanged();
      expectWasHit(findPartyMember(game.scene.getParty(), playerLead));
      expectWasNotHit(findPartyMember(game.scene.getParty(), Species.RAICHU));
    });

    it("should not cause the enemy AI to send out a fainted pokemon if they command 2 switches and one of the outgoing pokemon faints to pursuit", async () => {
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());
      game.scene.getEnemyField()[0]!.hp = 1;

      playerUsesPursuit(0);
      playerUsesPursuit(1);
      enemySwitches();
      await runCombatTurn();

      expect(game.scene.getEnemyParty().filter(p => p.isOnField())).toHaveLength(2);
      expect(game.scene.getEnemyParty().filter(p => p.isOnField() && p.isFainted())).toHaveLength(0);
    });

    // TODO: is this correct behavior?
    it("should fail if both pokemon use pursuit on a target that is switching out and it faints after the first one with no other targets on field", async () => {
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());
      game.scene.getEnemyField()[0]!.hp = 1;

      playerUsesPursuit(0);
      playerUsesPursuit(1);
      enemySwitches();
      await game.killPokemon(game.scene.getEnemyField()[1]);
      await runCombatTurn();

      expectPursuitPowerDoubled();
      expectPursuitSucceeded(game.scene.getPlayerField()[0]);
      expectPursuitFailed(game.scene.getPlayerField()[1]);
    });

    // TODO: is this correct behavior?
    it("should attack the second switching pokemon if both pokemon switch and the first is KOd", async () => {
      game.phaseInterceptor.onNextPhase(EncounterPhase, () => {
        game.scene.currentBattle.enemyLevels = [...game.scene.currentBattle.enemyLevels!, game.scene.currentBattle.enemyLevels![0]];
      });
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());
      game.scene.getEnemyField()[0]!.hp = 1;

      playerUsesPursuit(0);
      playerUsesPursuit(1);
      enemySwitches();
      afterFirstSwitch(() => {
        vi.spyOn(game.scene.currentBattle.trainer!, "getPartyMemberMatchupScores").mockReturnValue([[3, 100]]);
        vi.spyOn(game.scene.getPlayerPokemon()!, "getMatchupScore").mockReturnValue(0);
      });
      await runCombatTurn();

      expectPursuitPowerDoubled();
      expectPursuitSucceeded(game.scene.getPlayerField()[0]);
      expectPursuitSucceeded(game.scene.getPlayerField()[1]);
      expectWasHit(findPartyMember(game.scene.getEnemyParty(), Species.SNORLAX));
      expectNotOnField(findPartyMember(game.scene.getEnemyParty(), enemyLead))
        .and(p => expect(p?.isFainted()));
    });

    // TODO: confirm correct behavior and add tests for other pursuit/switch combos in doubles

    it("should not hit a pokemon being forced out with dragon tail", async () => {
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());

      game.move.select(Moves.DRAGON_TAIL);
      playerUsesPursuit(1);
      enemyUses(Moves.SPLASH);
      await runCombatTurn();

      // assert
      expectPursuitPowerUnchanged();
      expectWasHit(game.scene.getEnemyPokemon()).and(pkmn => {
        expect(pkmn?.turnData.attacksReceived[0]).toEqual(expect.objectContaining({
          move: Moves.PURSUIT,
          result: MoveResult.SUCCESS,
        }));
      });
    });

    // fails: command re-ordering does not work due to particulars of sort/move ordering;
    // pursuit moves after switch
    it("should hit the first pokemon to switch out in a double battle regardless of who was targeted", async () => {
      // arrange
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());

      // act
      playerUsesPursuit(0, BattlerIndex.ENEMY_2);
      playerUsesPursuit(1, BattlerIndex.ENEMY_2);
      enemySwitches(true);
      await runCombatTurn();

      // assert
      expectPursuitPowerDoubled();
      expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead)).and(expectNotOnField);
      expectWasNotHit(game.scene.getEnemyField()[0]);
      expectWasNotHit(game.scene.getEnemyField()[1]);
      expectPursuitSucceeded(game.scene.getPlayerField()[0]);
      expectPursuitSucceeded(game.scene.getPlayerField()[1]);
    });

    it("should not hit both pokemon in a double battle if both switch out", async () => {
      // arrange
      game.phaseInterceptor.onNextPhase(EncounterPhase, () => {
        game.scene.currentBattle.enemyLevels = [...game.scene.currentBattle.enemyLevels!, game.scene.currentBattle.enemyLevels![0]];
      });
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());

      // act
      playerUsesPursuit(0, BattlerIndex.ENEMY);
      playerUsesPursuit(1, BattlerIndex.ENEMY);
      enemySwitches();
      afterFirstSwitch(() => {
        vi.spyOn(game.scene.currentBattle.trainer!, "getPartyMemberMatchupScores").mockReturnValue([[3, 100]]);
        vi.spyOn(game.scene.getPlayerPokemon()!, "getMatchupScore").mockReturnValue(0);
      });
      await runCombatTurn();

      // assert
      expectPursuitPowerDoubled();
      expectWasHit(findPartyMember(game.scene.getEnemyParty(), enemyLead)).and(expectNotOnField);
      expectWasNotHit(game.scene.getEnemyField()[0]).and(expectIsSpecies(Species.BASCULIN));
      expectWasNotHit(game.scene.getEnemyField()[1]).and(expectIsSpecies(Species.ALCREMIE));
      expectPursuitSucceeded(game.scene.getPlayerField()[0]);
      expectPursuitSucceeded(game.scene.getPlayerField()[1]);
    });

    // This test is hard to verify, because it's hard to observe independently -
    // but depending on exactly how the command ordering is done, it is possible
    // for the command order to put one ally's Pursuit move before the other
    // ally's Pokemon command, even if the pursuit move does not target a
    // pursuer.  At this time, this "appears" to work correctly, because of
    // nuances in when phases are pushed vs. shifted; but the pursuit
    // MoveHeaderPhase is actually run before the switch, which is the only way
    // to find the issue at present. Asserting the direct output of the command order
    // is probably a better solution.
    it("should not move or apply tags before switch when ally switches and not pursuing an enemy", async () => {
      // arrange
      await startBattle();
      forceMovesFirst(game.scene.getPlayerField().reverse());

      // act
      playerSwitches(2);
      playerUsesPursuit(0);
      enemyUses(Moves.SPLASH);
      await game.phaseInterceptor.to(SwitchSummonPhase);

      // assert
      expect(game.phaseInterceptor.log).not.toContain("MovePhase");
      expect(game.phaseInterceptor.log).not.toContain("MoveHeaderPhase");
    });

    it("should not hit a switching ally for double damage (hard-switch, player field)", async () => {
      // arrange
      await startBattle();
      forceMovesLast(game.scene.getPlayerField());

      // act
      playerSwitches(2);
      playerUsesPursuit(1, BattlerIndex.PLAYER);
      enemyUses(Moves.SPLASH);
      await runCombatTurn();

      // assert
      expectPursuitPowerUnchanged();
      expectWasHit(game.scene.getPlayerField()[0]);
      expectWasNotHit(findPartyMember(game.scene.getParty(), playerLead)).and(expectNotOnField);
    });

    it("should not hit a switching ally for double damage (hard-switch, enemy field)", async () => {
      await startBattle();
      forceMovesLast(game.scene.getEnemyField());

      playerDoesNothing();
      enemySwitches(true);
      game.forceEnemyMove(Moves.PURSUIT, BattlerIndex.ENEMY);
      await runCombatTurn();

      expectPursuitPowerUnchanged();
      expectWasNotHit(findPartyMember(game.scene.getEnemyParty(), enemyLead)).and(expectNotOnField);
      expectWasHit(game.scene.getEnemyField()[0]);
    });

    it("should not hit a switching ally for double damage (switch move, player field)", async () => {
      // arrange
      await startBattle();
      forceMovesLast([...game.scene.getPlayerField()].reverse());

      // act
      playerUsesPursuit(0, BattlerIndex.PLAYER_2);
      playerUsesSwitchMove(1); // prompts need to be queued in the order of pursuit, then switch move or else they will softlock
      enemyUses(Moves.SPLASH);
      await runCombatTurn();

      // assert
      expectPursuitPowerUnchanged();
      expectWasHit(game.scene.getPlayerField()[1]);
      expectWasNotHit(findPartyMember(game.scene.getParty(), Species.RAICHU)).and(expectNotOnField);
    });

    it("should not hit a switching ally for double damage (switch move, enemy field)", async () => {
      // arrange
      await startBattle();
      forceMovesLast(game.scene.getEnemyField());

      // act
      playerDoesNothing();
      game.forceEnemyMove(Moves.U_TURN);
      game.forceEnemyMove(Moves.PURSUIT, BattlerIndex.ENEMY);
      await runCombatTurn();

      // assert
      expectPursuitPowerUnchanged();
      expectWasNotHit(findPartyMember(game.scene.getEnemyParty(), enemyLead)).and(expectNotOnField);
      expectWasHit(game.scene.getEnemyField()[0]);
    });
  });
});
