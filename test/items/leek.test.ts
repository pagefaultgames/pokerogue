import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { randInt } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Leek", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([{ name: "LEEK" }])
      .moveset([MoveId.TACKLE])
      .battleStyle("single");
  });

  it("should raise CRIT stage by 2 when held by FARFETCHD", async () => {
    await game.classicMode.startBattle([SpeciesId.FARFETCHD]);

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  });

  it("should raise CRIT stage by 2 when held by GALAR_FARFETCHD", async () => {
    await game.classicMode.startBattle([SpeciesId.GALAR_FARFETCHD]);

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  });

  it("should raise CRIT stage by 2 when held by SIRFETCHD", async () => {
    await game.classicMode.startBattle([SpeciesId.SIRFETCHD]);

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  });

  it("should raise CRIT stage by 2 when held by FARFETCHD line fused with Pokemon", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];

    await game.classicMode.startBattle([species[randInt(species.length)], SpeciesId.PIKACHU]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  });

  it("should raise CRIT stage by 2 when held by Pokemon fused with FARFETCHD line", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [SpeciesId.FARFETCHD, SpeciesId.GALAR_FARFETCHD, SpeciesId.SIRFETCHD];

    await game.classicMode.startBattle([SpeciesId.PIKACHU, species[randInt(species.length)]]);

    const [partyMember, ally] = game.scene.getPlayerParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  });

  it("should not raise CRIT stage when held by a Pokemon outside of FARFETCHD line", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemyMember = game.field.getEnemyPokemon();

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(0);
  });
});
