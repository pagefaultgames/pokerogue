import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#app/phases/berry-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/testUtils/gameManager";

describe("Moves - Lucky Chant", () => {
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
      .battleStyle("single")
      .moveset([MoveId.LUCKY_CHANT, MoveId.SPLASH, MoveId.FOLLOW_ME])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset([MoveId.FLOWER_TRICK])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent critical hits from moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    const firstTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp;

    game.move.select(MoveId.LUCKY_CHANT);

    await game.phaseInterceptor.to(BerryPhase, false);

    const secondTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits against the user's ally", async () => {
    game.override.battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.FOLLOW_ME);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const firstTurnDamage = playerPokemon[0].getMaxHp() - playerPokemon[0].hp;

    game.move.select(MoveId.FOLLOW_ME);
    game.move.select(MoveId.LUCKY_CHANT, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    const secondTurnDamage = playerPokemon[0].getMaxHp() - playerPokemon[0].hp - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });

  it("should prevent critical hits from field effects", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    enemyPokemon.addTag(BattlerTagType.ALWAYS_CRIT, 2, MoveId.NONE, 0);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    const firstTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp;

    game.move.select(MoveId.LUCKY_CHANT);

    await game.phaseInterceptor.to(BerryPhase, false);

    const secondTurnDamage = playerPokemon.getMaxHp() - playerPokemon.hp - firstTurnDamage;
    expect(secondTurnDamage).toBeLessThan(firstTurnDamage);
  });
});
