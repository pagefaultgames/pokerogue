import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { CommandPhase, TurnEndPhase, WeatherEffectPhase, PostTurnStatusEffectPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import Move, { allMoves } from "#app/data/move.js";
import { BlockNonDirectDamageAbAttr } from "#app/data/ability.js";
import { WeatherType } from "#app/data/weather.js";
import { NumberHolder } from "#app/utils.js";
import Pokemon from "#app/field/pokemon.js";
import {Mode} from "#app/ui/ui";
import {Command} from "#app/ui/command-ui-handler";
import { StatusEffect } from "#app/data/status-effect";

describe("Abilities - Magic Guard", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MAGIC_GUARD);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("Magic Guard prevents damage caused by weather", async () => {
    vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.SANDSTORM);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    await game.startBattle([Species.MAGIKARP]);
    const hpPokemon = game.scene.getPlayerPokemon().hp;
    //Attempting to applying weather damage now...
    new WeatherEffectPhase(game.scene).start();
    const hpLost = (hpPokemon === game.scene.getPlayerPokemon().hp);
    expect(hpLost).toBe(true);
  });

  it("Magic Guard prevents damage caused by poison but Pokemon still can be poisoned and take damage upon losing Magic Guard", async () => {
    //Toxic keeps track of the turn counters -> important that Magic Guard keeps track of post-Toxic turns 
    vi.spyOn(overrides, "STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.POISON);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SKILL_SWAP, Moves.SPLASH]);
    await game.startBattle([Species.MAGIKARP]);
    const pokemonMG = game.scene.getPlayerPokemon();
    const startingHP = pokemonMG.hp;
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
  	const statusEffectPhase = new PostTurnStatusEffectPhase(game.scene, 0);
    statusEffectPhase.start();
    const lostHPWithMG = (pokemonMG.hp === startingHP);
    //await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.SKILL_SWAP));
    await game.phaseInterceptor.to(TurnEndPhase);
    statusEffectPhase.start();
    const lostHPWithNoMG = (pokemonMG.hp < startingHP);

    expect(lostHPWithMG).toBe(true);
    expect(lostHPWithNoMG).toBe(true);
  });

/*
  it("Magic Guard prevents damage caused by burn but Pokemon still can be burned and take damage upon losing Magic Guard", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents damage caused by entry hazards", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent poison from Toxic Spikes", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents curse status damage", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents crash damange", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents damage from recoil", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent damage from Struggle's recoil", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard prevents self-damage from attacking moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent self-damage from confusion", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });

  it("Magic Guard does not prevent self-damage from non-attacking moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.CHARM));

    await game.phaseInterceptor.to(TurnEndPhase);
  });
  */
});
