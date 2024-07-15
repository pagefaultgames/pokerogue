import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  CommandPhase,
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { StatusEffect } from "#app/data/status-effect.js";
import { allAbilities } from "#app/data/ability.js";
import { Abilities } from "#app/enums/abilities.js";

describe("Abilities - Pastel Veil", () => {
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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TOXIC_THREAD, Moves.TOXIC_THREAD, Moves.TOXIC_THREAD, Moves.TOXIC_THREAD]);
  });

  it("prevents the user and its allies from being afflicted by poison", async () => {
    await game.startBattle([Species.GALAR_PONYTA, Species.MAGIKARP]);
    const ponyta = game.scene.getPlayerField()[0];

    vi.spyOn(ponyta, "getAbility").mockReturnValue(allAbilities[Abilities.PASTEL_VEIL]);

    expect(ponyta.hasAbility(Abilities.PASTEL_VEIL)).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("it heals the poisoned status condition of allies if user is sent out into battle", async () => {
    await game.startBattle([Species.MAGIKARP, Species.MAGIKARP, Species.GALAR_PONYTA]);
    const ponyta = game.scene.getParty().find(p => p.species.speciesId === Species.GALAR_PONYTA);

    vi.spyOn(ponyta, "getAbility").mockReturnValue(allAbilities[Abilities.PASTEL_VEIL]);

    expect(ponyta.hasAbility(Abilities.PASTEL_VEIL)).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);
    expect(game.scene.getPlayerField().some(p => p.status?.effect === StatusEffect.POISON)).toBe(true);

    const poisonedMon = game.scene.getPlayerField().find(p => p.status?.effect === StatusEffect.POISON);

    await game.phaseInterceptor.to(CommandPhase);
    game.doAttack(getMovePosition(game.scene, (poisonedMon.getBattlerIndex() as 0 | 1), Moves.SPLASH));
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
