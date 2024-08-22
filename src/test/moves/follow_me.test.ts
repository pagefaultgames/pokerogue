import { BattlerIndex } from "#app/battle.js";
import { Stat } from "#app/data/pokemon-stat";
import { Abilities } from "#app/enums/abilities.js";
import { CommandPhase, SelectTargetPhase, TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Follow Me", () => {
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
    game.override.battleType("double");
    game.override.starterSpecies(Species.AMOONGUSS);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([ Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK ]);
    game.override.enemyMoveset([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  test(
    "move should redirect enemy attacks to the user",
    async () => {
      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      const playerStartingHp = playerPokemon.map(p => p.hp);

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOLLOW_ME));
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.QUICK_ATTACK));
      await game.phaseInterceptor.to(SelectTargetPhase, false);

      game.doSelectTarget(BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(TurnEndPhase, false);

      expect(playerPokemon[0].hp).toBeLessThan(playerStartingHp[0]);
      expect(playerPokemon[1].hp).toBe(playerStartingHp[1]);
    }, TIMEOUT
  );

  test(
    "move should redirect enemy attacks to the first ally that uses it",
    async () => {
      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      const playerStartingHp = playerPokemon.map(p => p.hp);

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOLLOW_ME));
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.FOLLOW_ME));
      await game.phaseInterceptor.to(TurnEndPhase, false);

      playerPokemon.sort((a, b) => a.getBattleStat(Stat.SPD) - b.getBattleStat(Stat.SPD));

      expect(playerPokemon[1].hp).toBeLessThan(playerStartingHp[1]);
      expect(playerPokemon[0].hp).toBe(playerStartingHp[0]);
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by Stalwart",
    async () => {
      game.override.ability(Abilities.STALWART);
      game.override.moveset([ Moves.QUICK_ATTACK ]);
      game.override.enemyMoveset([ Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME ]);

      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_ATTACK));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.QUICK_ATTACK));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);
      await game.phaseInterceptor.to(TurnEndPhase, false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyStartingHp[0]);
      expect(enemyPokemon[1].hp).toBeLessThan(enemyStartingHp[1]);
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by Snipe Shot",
    async () => {
      game.override.moveset([ Moves.SNIPE_SHOT ]);
      game.override.enemyMoveset([ Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME ]);

      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SNIPE_SHOT));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.SNIPE_SHOT));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);
      await game.phaseInterceptor.to(TurnEndPhase, false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyStartingHp[0]);
      expect(enemyPokemon[1].hp).toBeLessThan(enemyStartingHp[1]);
    }, TIMEOUT
  );
});
