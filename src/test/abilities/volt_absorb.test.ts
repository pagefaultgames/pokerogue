import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle";

// See also: TypeImmunityAbAttr
describe("Abilities - Volt Absorb", () => {
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
    game.override.battleType("single");
    game.override.disableCrits();
  });

  it("does not activate when CHARGE is used", async () => {
    const moveToUse = Moves.CHARGE;
    const ability = Abilities.VOLT_ABSORB;

    game.override.moveset([moveToUse]);
    game.override.ability(ability);
    game.override.enemyMoveset([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    game.override.enemySpecies(Species.DUSKULL);
    game.override.enemyAbility(Abilities.BALL_FETCH);

    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPDEF)).toBe(1);
    expect(playerPokemon.getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });
  it("should activate regardless of accuracy checks", async () => {
    game.override.moveset(Moves.THUNDERBOLT);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.VOLT_ABSORB);

    await game.classicMode.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.THUNDERBOLT);
    enemyPokemon.hp = enemyPokemon.hp - 1;
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });
});
