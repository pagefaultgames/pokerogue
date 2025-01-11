import { BattlerIndex } from "#app/battle";
import { Button } from "#app/enums/buttons";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import type { MovePhase } from "#app/phases/move-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Instruct", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function instructSuccess(target: Pokemon, move: Moves): void {
    expect(target.getLastXMoves(-1)[0].move).toBe(move);
    expect(target.getLastXMoves(-1)[1].move).toBe(target.getLastXMoves()[0].move);
    expect(target.getMoveset().find(m => m?.moveId === move)?.ppUsed).toBe(2);
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
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.NO_GUARD)
      .enemyLevel(100)
      .startingLevel(100)
      .ability(Abilities.BALL_FETCH)
      .disableCrits();
  });

  it("should repeat target's last used move", async () => {
    game.override.moveset(Moves.INSTRUCT);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, Moves.SONIC_BOOM);

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.SONIC_BOOM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);

    await game.phaseInterceptor.to("MovePhase"); // enemy attacks us
    await game.phaseInterceptor.to("MovePhase", false); // instruct
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(game.scene.getPlayerPokemon());
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.phaseInterceptor.to("MovePhase", false); // enemy repeats move
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(enemy);
    expect(currentPhase.move.moveId).toBe(Moves.SONIC_BOOM);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(enemy, Moves.SONIC_BOOM);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should repeat enemy's move through substitute", async () => {
    game.override.moveset([ Moves.INSTRUCT, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, [ Moves.SONIC_BOOM, Moves.SUBSTITUTE ]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SUBSTITUTE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.toNextTurn();

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.SONIC_BOOM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(game.scene.getEnemyPokemon()!, Moves.SONIC_BOOM);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should repeat ally's attack on enemy", async () => {
    game.override
      .battleType("double")
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.SHUCKLE ]);

    const [ amoonguss, shuckle ] = game.scene.getPlayerField();
    game.move.changeMoveset(amoonguss, [ Moves.INSTRUCT, Moves.SONIC_BOOM ]);
    game.move.changeMoveset(shuckle, [ Moves.INSTRUCT, Moves.SONIC_BOOM ]);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(shuckle, Moves.SONIC_BOOM);
    expect(game.scene.getEnemyField()[0].getInverseHp()).toBe(40);
  });

  // TODO: Enable test case once gigaton hammer (and blood moon) are reworked
  it.todo("should repeat enemy's Gigaton Hammer", async () => {
    game.override
      .moveset(Moves.INSTRUCT)
      .enemyLevel(5);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, Moves.GIGATON_HAMMER);

    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(enemy, Moves.GIGATON_HAMMER);
  });

  it("should respect enemy's status condition", async () => {
    game.override
      .moveset([ Moves.INSTRUCT, Moves.THUNDER_WAVE ])
      .enemyMoveset(Moves.SONIC_BOOM);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    game.move.select(Moves.THUNDER_WAVE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MovePhase");
    // force enemy's instructed move to bork and then immediately thaw out
    await game.move.forceStatusActivation(true);
    await game.move.forceStatusActivation(false);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const moveHistory = game.scene.getEnemyPokemon()?.getLastXMoves(-1)!;
    expect(moveHistory.map(m => m.move)).toEqual([ Moves.SONIC_BOOM, Moves.NONE, Moves.SONIC_BOOM ]);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should not repeat enemy's out of pp move", async () => {
    game.override
      .moveset(Moves.INSTRUCT)
      .enemySpecies(Species.UNOWN);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemyPokemon, Moves.HIDDEN_POWER);
    const moveUsed = enemyPokemon.moveset.find(m => m?.moveId === Moves.HIDDEN_POWER)!;
    moveUsed.ppUsed = moveUsed.getMovePp() - 1;

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.HIDDEN_POWER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const playerMoves = game.scene.getPlayerPokemon()!.getLastXMoves(-1)!;
    expect(playerMoves[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.getMoveHistory().length).toBe(1);
  });

  it("should fail if no move has yet been used by target", async () => {
    game.override
      .moveset(Moves.INSTRUCT)
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should attempt to call enemy's disabled move, but move use itself should fail", async () => {
    game.override
      .moveset([ Moves.INSTRUCT, Moves.DISABLE ])
      .battleType("double");
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.DROWZEE ]);

    const [ enemy1, enemy2 ] = game.scene.getEnemyField();
    game.move.changeMoveset(enemy1, Moves.SONIC_BOOM);
    game.move.changeMoveset(enemy2, Moves.SPLASH);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.DISABLE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerField()[0].getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    const enemyMove = game.scene.getEnemyField()[0]!.getLastXMoves()[0];
    expect(enemyMove.result).toBe(MoveResult.FAIL);
    expect(game.scene.getEnemyField()[0].getMoveset().find(m => m?.moveId === Moves.SONIC_BOOM)?.ppUsed).toBe(1);
  });

  it("should allow for dancer copying of instructed dance move", async () => {
    game.override
      .battleType("double")
      .enemyMoveset([ Moves.INSTRUCT, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.ORICORIO, Species.VOLCARONA ]);

    const [ oricorio, volcarona ] = game.scene.getPlayerField();
    game.move.changeMoveset(oricorio, Moves.SPLASH);
    game.move.changeMoveset(volcarona, Moves.FIERY_DANCE);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(volcarona, Moves.FIERY_DANCE);
    expect(game.scene.getEnemyPokemon()?.turnData.attacksReceived).toBe(4);
  });

  it("should not repeat enemy's move through protect", async () => {
    game.override.moveset([ Moves.INSTRUCT ]);
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, Moves.PROTECT);
    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(enemy.getLastXMoves(-1)[0].move).toBe(Moves.PROTECT);
    expect(enemy.getLastXMoves(-1)[1]).toBeUndefined(); // undefined because instruct failed and didn't repeat
    expect(enemy.getMoveset().find(m => m?.moveId === Moves.PROTECT)?.ppUsed).toBe(1);
  });

  it("should not repeat enemy's charging move", async () => {
    game.override
      .moveset([ Moves.INSTRUCT ])
      .enemyMoveset([ Moves.SONIC_BOOM, Moves.HYPER_BEAM ]);
    await game.classicMode.startBattle([ Species.SHUCKLE ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.HYPER_BEAM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    // instruct fails at copying last move due to charging turn (rather than instructing sonic boom)
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  // TODO: Clean test code up once learn move utility function is added
  // to reduce jankiness and decrease likelihood of future borks
  it("should not repeat move since forgotten by target", async () => {
    game.override
      .enemyLevel(5)
      .xpMultiplier(50)
      .enemySpecies(Species.WURMPLE)
      .enemyMoveset(Moves.INSTRUCT);
    await game.classicMode.startBattle([ Species.REGIELEKI ]);

    const regieleki = game.scene.getPlayerPokemon()!;
    // fill out moveset with random moves
    game.move.changeMoveset(regieleki, [ Moves.ELECTRO_DRIFT, Moves.SPLASH, Moves.ICE_BEAM, Moves.ANCIENT_POWER ]);

    game.move.select(Moves.ELECTRO_DRIFT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.phaseInterceptor.to("FaintPhase");
    // setup macro to mash enter and learn hydro pump in slot 1
    game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
      game.scene.ui.getHandler().processInput(Button.ACTION); // mash enter to learn level up move
      game.onNextPrompt("LearnMovePhase", Mode.SUMMARY, () => {
        game.scene.ui.getHandler().processInput(Button.ACTION);
        game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
          game.scene.ui.getHandler().processInput(Button.ACTION);
        });
      });
    });

    await game.toNextWave();

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(game.scene.getEnemyField()[0].getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should disregard priority of instructed move on use", async () => {
    game.override
      .enemyMoveset([ Moves.SPLASH, Moves.WHIRLWIND ])
      .moveset(Moves.INSTRUCT);
    await game.classicMode.startBattle([ Species.LUCARIO, Species.BANETTE ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.WHIRLWIND, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // lucario instructed enemy whirlwind at 0 priority to switch itself out
    const instructedMove = enemyPokemon.getLastXMoves(-1)[1];
    expect(instructedMove.result).toBe(MoveResult.SUCCESS);
    expect(instructedMove.move).toBe(Moves.WHIRLWIND);
    expect(game.scene.getPlayerPokemon()?.species.speciesId).toBe(Species.BANETTE);
  });

  it("should respect moves' original priority for psychic terrain", async () => {
    game.override.
      battleType("double")
      .moveset([ Moves.QUICK_ATTACK, Moves.SPLASH, Moves.INSTRUCT ])
      .enemyMoveset([ Moves.SPLASH, Moves.PSYCHIC_TERRAIN ]);
    await game.classicMode.startBattle([ Species.BANETTE, Species.KLEFKI ]);

    game.move.select(Moves.QUICK_ATTACK, BattlerIndex.PLAYER, BattlerIndex.ENEMY); // succeeds due to terrain no
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // quick attack failed when instructed
    const banette = game.scene.getPlayerPokemon()!;
    expect(banette.getLastXMoves(-1)[1].move).toBe(Moves.QUICK_ATTACK);
    expect(banette.getLastXMoves(-1)[1].result).toBe(MoveResult.FAIL);
  });

  it("should still work w/ prankster in psychic terrain", async () => {
    game.override.
      battleType("double")
      .enemyMoveset([ Moves.SPLASH, Moves.PSYCHIC_TERRAIN ])
      .ability(Abilities.PRANKSTER);
    await game.classicMode.startBattle([ Species.BANETTE, Species.KLEFKI ]);

    const [ banette, klefki ] = game.scene.getPlayerField()!;
    game.move.changeMoveset(banette, Moves.VINE_WHIP);
    game.move.changeMoveset(klefki, [ Moves.INSTRUCT, Moves.SPLASH ]);

    game.move.select(Moves.VINE_WHIP, BattlerIndex.PLAYER, BattlerIndex.ENEMY); // succeeds due to terrain
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    instructSuccess(banette, Moves.VINE_WHIP);
  });

  it("should cause spread moves to correctly hit targets in doubles after singles", async () => {
    game.override
      .battleType("even-doubles")
      .moveset([ Moves.BREAKING_SWIPE, Moves.INSTRUCT, Moves.SPLASH ])
      .enemyMoveset(Moves.SONIC_BOOM)
      .enemySpecies(Species.AXEW)
      .startingLevel(500);
    await game.classicMode.startBattle([ Species.KORAIDON, Species.KLEFKI ]);

    const koraidon = game.scene.getPlayerField()[0]!;

    game.move.select(Moves.BREAKING_SWIPE);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[0].targets).toEqual([ BattlerIndex.ENEMY ]);
    await game.toNextWave();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    // did not take damage since enemies died beforehand;
    // last move used hit both enemies
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[1].targets?.sort()).toEqual([ BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
  });

  it("should cause AoE moves to correctly hit everyone in doubles after singles", async () => {
    game.override
      .battleType("even-doubles")
      .moveset([ Moves.BRUTAL_SWING, Moves.INSTRUCT, Moves.SPLASH ])
      .enemySpecies(Species.AXEW)
      .enemyMoveset(Moves.SONIC_BOOM)
      .startingLevel(500);
    await game.classicMode.startBattle([ Species.KORAIDON, Species.KLEFKI ]);

    const koraidon = game.scene.getPlayerField()[0]!;

    game.move.select(Moves.BRUTAL_SWING);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[0].targets).toEqual([ BattlerIndex.ENEMY ]);
    await game.toNextWave();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    // did not take damage since enemies died beforehand;
    // last move used hit everything around it
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[1].targets?.sort()).toEqual([ BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
  });

  it("should cause multi-hit moves to hit the appropriate number of times in singles", async () => {
    game.override
      .enemyAbility(Abilities.SKILL_LINK)
      .moveset([ Moves.SPLASH, Moves.INSTRUCT ])
      .enemyMoveset(Moves.BULLET_SEED);
    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const bulbasaur = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);

    await game.toNextTurn();
    game.move.select(Moves.INSTRUCT);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);
  });

  it("should cause multi-hit moves to hit the appropriate number of times in doubles", async () => {
    game.override
      .battleType("double")
      .enemyAbility(Abilities.SKILL_LINK)
      .moveset([ Moves.SPLASH, Moves.INSTRUCT ])
      .enemyMoveset([ Moves.BULLET_SEED, Moves.SPLASH ])
      .enemyLevel(5);
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.IVYSAUR ]);

    const [ , ivysaur ] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);

    await game.toNextTurn();
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2 ]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);
  });
});
