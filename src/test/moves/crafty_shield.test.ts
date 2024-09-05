import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";

const TIMEOUT = 20 * 1000;

describe("Moves - Crafty Shield", () => {
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

    game.override.moveset([Moves.CRAFTY_SHIELD, Moves.SPLASH, Moves.SWORDS_DANCE]);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Array(4).fill(Moves.GROWL));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user and allies from status moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.CRAFTY_SHIELD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
    }, TIMEOUT
  );

  test(
    "should not protect the user and allies from attack moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.CRAFTY_SHIELD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.some(p => p.hp < p.getMaxHp())).toBeTruthy();
    }, TIMEOUT
  );

  test(
    "should protect the user and allies from moves that ignore other protection",
    async () => {
      game.override.enemySpecies(Species.DUSCLOPS);
      game.override.enemyMoveset(Array(4).fill(Moves.CURSE));

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.CRAFTY_SHIELD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.getTag(BattlerTagType.CURSED)).toBeUndefined());
    }, TIMEOUT
  );

  test(
    "should not block allies' self-targeted moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();

      game.move.select(Moves.CRAFTY_SHIELD);

      await game.phaseInterceptor.to(CommandPhase);

      game.move.select(Moves.SWORDS_DANCE, 1);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon[0].getStatStage(Stat.ATK)).toBe(0);
      expect(leadPokemon[1].getStatStage(Stat.ATK)).toBe(2);
    }
  );
});
