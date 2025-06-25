import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";

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

    game.override
      .battleStyle("double")
      .moveset([MoveId.CRAFTY_SHIELD, MoveId.SPLASH, MoveId.SWORDS_DANCE])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.GROWL])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  test("should protect the user and allies from status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.CRAFTY_SHIELD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
  });

  test("should not protect the user and allies from attack moves", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.CRAFTY_SHIELD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.some(p => p.hp < p.getMaxHp())).toBeTruthy();
  });

  test("should protect the user and allies from moves that ignore other protection", async () => {
    game.override.enemySpecies(SpeciesId.DUSCLOPS).enemyMoveset([MoveId.CURSE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.CRAFTY_SHIELD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.getTag(BattlerTagType.CURSED)).toBeUndefined());
  });

  test("should not block allies' self-targeted moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.CRAFTY_SHIELD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SWORDS_DANCE, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon[0].getStatStage(Stat.ATK)).toBe(0);
    expect(leadPokemon[1].getStatStage(Stat.ATK)).toBe(2);
  });
});
