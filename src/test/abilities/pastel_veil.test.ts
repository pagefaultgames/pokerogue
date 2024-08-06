import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { CommandPhase, TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { StatusEffect } from "#app/data/status-effect.js";
import { allAbilities } from "#app/data/ability.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerIndex } from "#app/battle.js";

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
    game.override.battleType("double");
    game.override.moveset([Moves.SPLASH]);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.TOXIC_THREAD, Moves.TOXIC_THREAD, Moves.TOXIC_THREAD, Moves.TOXIC_THREAD]);
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
    game.doAttack(getMovePosition(game.scene, (poisonedMon.getBattlerIndex() as BattlerIndex.PLAYER | BattlerIndex.PLAYER_2), Moves.SPLASH));
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
