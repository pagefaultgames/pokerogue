import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Baneful Bunker", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.TOXAPEX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.BANEFUL_BUNKER)
      .startingLevel(100)
      .enemyLevel(100);
  });

  function expectProtected() {
    expect(game.field.getEnemyPokemon()).toHaveFullHp();
    expect(game.field.getPlayerPokemon()).toHaveStatusEffect(StatusEffect.POISON);
  }

  it("should protect the user and poison attackers that make contact", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    game.move.use(MoveId.SLASH);
    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should ignore accuracy checks", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    game.move.use(MoveId.SLASH);
    await game.phaseInterceptor.to("MoveEndPhase"); // baneful bunker
    await game.move.forceMiss();

    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should block non-contact moves without poisoning attackers", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const charizard = game.field.getPlayerPokemon();
    const toxapex = game.field.getEnemyPokemon();

    game.move.use(MoveId.FLASH_CANNON);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(toxapex).toHaveFullHp();
    expect(charizard).not.toHaveStatusEffect(StatusEffect.POISON);
  });

  it("should protect the user from status moves without poisoning attackers", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD);

    const charizard = game.field.getPlayerPokemon();
    const toxapex = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(toxapex).toHaveStatusEffect(StatusEffect.NONE);
    expect(charizard).toHaveStatusEffect(StatusEffect.NONE);
  });
});
