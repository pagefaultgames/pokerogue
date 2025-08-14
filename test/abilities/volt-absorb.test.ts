import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override.battleStyle("single").criticalHits(false);
  });

  it("does not activate when CHARGE is used", async () => {
    const moveToUse = MoveId.CHARGE;
    const ability = AbilityId.VOLT_ABSORB;

    game.override
      .moveset([moveToUse])
      .ability(ability)
      .enemyMoveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.DUSKULL)
      .enemyAbility(AbilityId.BALL_FETCH);

    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.SPDEF)).toBe(1);
    expect(playerPokemon.getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("should activate regardless of accuracy checks", async () => {
    game.override
      .moveset(MoveId.THUNDERBOLT)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.VOLT_ABSORB);

    await game.classicMode.startBattle();

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.THUNDERBOLT);
    enemyPokemon.hp = enemyPokemon.hp - 1;
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("regardless of accuracy should not trigger on pokemon in semi invulnerable state", async () => {
    game.override
      .moveset(MoveId.THUNDERBOLT)
      .enemyMoveset(MoveId.DIVE)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.VOLT_ABSORB);

    await game.classicMode.startBattle();

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.THUNDERBOLT);
    enemyPokemon.hp = enemyPokemon.hp - 1;
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });
});
