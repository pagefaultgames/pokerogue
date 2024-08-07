import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { Abilities } from "#app/enums/abilities.js";
import { BerryPhase, TurnEndPhase } from "#app/phases.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Lucky Chant", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleType("single")
      .moveset([Moves.LUCKY_CHANT, Moves.SPLASH, Moves.FOLLOW_ME])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Array(4).fill(Moves.FLOWER_TRICK))
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should prevent critical hits from moves",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      const firstTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.LUCKY_CHANT));

      await game.phaseInterceptor.to(BerryPhase, false);

      const secondTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp - firstTurnDamage;
      expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
    }, TIMEOUT
  );

  it(
    "should prevent critical hits against the user's ally",
    async () => {
      game.override.battleType("double");

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerField();

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOLLOW_ME));
      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      const firstTurnDamage = playerPokemon[0].getMaxHp() - playerPokemon[0].hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FOLLOW_ME));
      game.doAttack(getMovePosition(game.scene, 1, Moves.LUCKY_CHANT));

      await game.phaseInterceptor.to(BerryPhase, false);

      const secondTurnDamage = playerPokemon[0].getMaxHp() - playerPokemon[0].hp - firstTurnDamage;
      expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
    }, TIMEOUT
  );

  it(
    "should prevent critical hits from field effects",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      enemyPokemon.addTag(BattlerTagType.ALWAYS_CRIT, 2, Moves.NONE, 0);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(TurnEndPhase);

      const firstTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.LUCKY_CHANT));

      await game.phaseInterceptor.to(BerryPhase, false);

      const secondTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp - firstTurnDamage;
      expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
    }, TIMEOUT
  );
});
