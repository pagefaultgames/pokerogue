import { TurnEndPhase } from "#app/phases/turn-end-phase";
import * as Utils from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Leek", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH])
      .startingHeldItems([{ name: "LEEK" }])
      .moveset([ Moves.TACKLE ])
      .disableCrits()
      .battleType("single");
  });

  it("should raise CRIT stage by 2 when held by FARFETCHD", async () => {
    await game.startBattle([
      Species.FARFETCHD
    ]);

    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  }, 20000);

  it("should raise CRIT stage by 2 when held by GALAR_FARFETCHD", async () => {
    await game.startBattle([
      Species.GALAR_FARFETCHD
    ]);

    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  }, 20000);

  it("should raise CRIT stage by 2 when held by SIRFETCHD", async () => {
    await game.startBattle([
      Species.SIRFETCHD
    ]);

    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  }, 20000);

  it("should raise CRIT stage by 2 when held by FARFETCHD line fused with Pokemon", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD];

    await game.startBattle([
      species[Utils.randInt(species.length)],
      Species.PIKACHU,
    ]);

    const [ partyMember, ally ] = game.scene.getParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;

    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  }, 20000);

  it("should raise CRIT stage by 2 when held by Pokemon fused with FARFETCHD line", async () => {
    // Randomly choose from the Farfetch'd line
    const species = [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD];

    await game.startBattle([
      Species.PIKACHU,
      species[Utils.randInt(species.length)]
    ]);

    const [ partyMember, ally ] = game.scene.getParty();

    // Fuse party members (taken from PlayerPokemon.fuse(...) function)
    partyMember.fusionSpecies = ally.species;
    partyMember.fusionFormIndex = ally.formIndex;
    partyMember.fusionAbilityIndex = ally.abilityIndex;
    partyMember.fusionShiny = ally.shiny;
    partyMember.fusionVariant = ally.variant;
    partyMember.fusionGender = ally.gender;
    partyMember.fusionLuck = ally.luck;


    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(2);
  }, 20000);

  it("should not raise CRIT stage when held by a Pokemon outside of FARFETCHD line", async () => {
    await game.startBattle([
      Species.PIKACHU
    ]);

    const enemyMember = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyMember, "getCritStage");

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyMember.getCritStage).toHaveReturnedWith(0);
  }, 20000);
});
