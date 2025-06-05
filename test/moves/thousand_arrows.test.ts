import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Thousand Arrows", () => {
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
    game.override.battleStyle("single");
    game.override.enemySpecies(SpeciesId.TOGETIC);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([MoveId.THOUSAND_ARROWS]);
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.SPLASH, MoveId.SPLASH, MoveId.SPLASH]);
  });

  it("move should hit and ground Flying-type targets", async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.THOUSAND_ARROWS);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    // Enemy should not be grounded before move effect is applied
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("move should hit and ground targets with Levitate", async () => {
    game.override.enemySpecies(SpeciesId.SNORLAX);
    game.override.enemyAbility(AbilityId.LEVITATE);

    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.THOUSAND_ARROWS);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    // Enemy should not be grounded before move effect is applied
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("move should hit and ground targets under the effects of Magnet Rise", async () => {
    game.override.enemySpecies(SpeciesId.SNORLAX);

    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    enemyPokemon.addTag(BattlerTagType.FLOATING, undefined, MoveId.MAGNET_RISE);

    game.move.select(MoveId.THOUSAND_ARROWS);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(enemyPokemon.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });
});
