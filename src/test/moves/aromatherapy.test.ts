import { StatusEffect } from "#app/enums/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Aromatherapy", () => {
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
      .moveset([ Moves.AROMATHERAPY, Moves.SPLASH ])
      .statusEffect(StatusEffect.BURN)
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should cure status effect of the user, its ally, and all party pokemon", async () => {
    await game.classicMode.startBattle([ Species.RATTATA, Species.RATTATA, Species.RATTATA ]);
    const [ leftPlayer, rightPlayer, partyPokemon ] = game.scene.getParty();

    vi.spyOn(leftPlayer, "resetStatus");
    vi.spyOn(rightPlayer, "resetStatus");
    vi.spyOn(partyPokemon, "resetStatus");

    game.move.select(Moves.AROMATHERAPY, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(rightPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(partyPokemon.resetStatus).toHaveBeenCalledOnce();

    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(rightPlayer.status?.effect).toBeUndefined();
    expect(partyPokemon.status?.effect).toBeUndefined();
  });

  it("should not cure status effect of the target/target's allies", async () => {
    game.override.enemyStatusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([ Species.RATTATA, Species.RATTATA ]);
    const [ leftOpp, rightOpp ] = game.scene.getEnemyField();

    vi.spyOn(leftOpp, "resetStatus");
    vi.spyOn(rightOpp, "resetStatus");

    game.move.select(Moves.AROMATHERAPY, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(leftOpp.resetStatus).toHaveBeenCalledTimes(0);
    expect(rightOpp.resetStatus).toHaveBeenCalledTimes(0);

    expect(leftOpp.status?.effect).toBeTruthy();
    expect(rightOpp.status?.effect).toBeTruthy();

    expect(leftOpp.status?.effect).toBe(StatusEffect.BURN);
    expect(rightOpp.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should not cure status effect of allies ON FIELD with Sap Sipper, should still cure allies in party", async () => {
    game.override.ability(Abilities.SAP_SIPPER);
    await game.classicMode.startBattle([ Species.RATTATA, Species.RATTATA, Species.RATTATA ]);
    const [ leftPlayer, rightPlayer, partyPokemon ] = game.scene.getParty();

    vi.spyOn(leftPlayer, "resetStatus");
    vi.spyOn(rightPlayer, "resetStatus");
    vi.spyOn(partyPokemon, "resetStatus");

    game.move.select(Moves.AROMATHERAPY, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(rightPlayer.resetStatus).toHaveBeenCalledTimes(0);
    expect(partyPokemon.resetStatus).toHaveBeenCalledOnce();

    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(rightPlayer.status?.effect).toBe(StatusEffect.BURN);
    expect(partyPokemon.status?.effect).toBeUndefined();
  });
});
