import { BattlerIndex } from "#app/battle";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Tera Starstorm", () => {
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
      .moveset([Moves.TERA_STARSTORM, Moves.SPLASH])
      .battleStyle("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(30)
      .enemySpecies(Species.MAGIKARP);
  });

  it("changes type to Stellar when used by Terapagos in its Stellar Form", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.TERAPAGOS]);

    const terapagos = game.scene.getPlayerPokemon()!;
    terapagos.isTerastallized = true;

    vi.spyOn(terapagos, "getMoveType");

    game.move.select(Moves.TERA_STARSTORM);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(terapagos.getMoveType).toHaveReturnedWith(PokemonType.STELLAR);
  });

  it("targets both opponents in a double battle when used by Terapagos in its Stellar Form", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.TERAPAGOS]);

    const terapagos = game.scene.getPlayerParty()[1];
    terapagos.isTerastallized = true;

    game.move.select(Moves.TERA_STARSTORM, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.TERA_STARSTORM, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    const enemyField = game.scene.getEnemyField();

    // Pokemon other than Terapagos should not be affected - only hits one target
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyField.some(pokemon => pokemon.isFullHp())).toBe(true);

    // Terapagos in Stellar Form should hit both targets
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyField.every(pokemon => pokemon.isFullHp())).toBe(false);
  });

  it("targets both opponents in a double battle when used by Terapagos immediately after terastallizing", async () => {
    await game.classicMode.startBattle([Species.TERAPAGOS]);

    const terapagos = game.scene.getPlayerParty()[0];
    terapagos.isTerastallized = false;

    game.move.selectWithTera(Moves.TERA_STARSTORM, 0);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    const enemyField = game.scene.getEnemyField();

    // Terapagos in Stellar Form should hit both targets
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyField.some(pokemon => pokemon.isFullHp())).toBe(false);
  });

  it("targets only one opponent in a double battle when used by Terapagos without terastallizing", async () => {
    await game.classicMode.startBattle([Species.TERAPAGOS]);

    const terapagos = game.scene.getPlayerParty()[0];
    terapagos.isTerastallized = false;

    game.move.select(Moves.TERA_STARSTORM, 0, BattlerIndex.ENEMY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    const enemyField = game.scene.getEnemyField();

    // Terapagos in Stellar Form should hit both targets
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyField.some(pokemon => pokemon.isFullHp())).toBe(true);
  });

  it("applies the effects when Terapagos in Stellar Form is fused with another Pokemon", async () => {
    await game.classicMode.startBattle([Species.TERAPAGOS, Species.CHARMANDER, Species.MAGIKARP]);

    const fusionedMon = game.scene.getPlayerParty()[0];
    const magikarp = game.scene.getPlayerParty()[2];

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    fusionedMon.fusionSpecies = magikarp.species;
    fusionedMon.fusionFormIndex = magikarp.formIndex;
    fusionedMon.fusionAbilityIndex = magikarp.abilityIndex;
    fusionedMon.fusionShiny = magikarp.shiny;
    fusionedMon.fusionVariant = magikarp.variant;
    fusionedMon.fusionGender = magikarp.gender;
    fusionedMon.fusionLuck = magikarp.luck;

    fusionedMon.isTerastallized = true;

    vi.spyOn(fusionedMon, "getMoveType");

    game.move.select(Moves.TERA_STARSTORM, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Fusion and terastallized
    expect(fusionedMon.isFusion()).toBe(true);
    // Move effects should be applied
    expect(fusionedMon.getMoveType).toHaveReturnedWith(PokemonType.STELLAR);
    expect(game.scene.getEnemyField().every(pokemon => pokemon.isFullHp())).toBe(false);
  });
});
