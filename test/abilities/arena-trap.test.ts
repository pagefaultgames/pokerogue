import { getPokemonNameWithAffix } from "#app/messages";
import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import type { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Arena Trap", () => {
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
      .ability(AbilityId.ARENA_TRAP)
      .enemyAbility(AbilityId.ARENA_TRAP)
      .enemySpecies(SpeciesId.RALTS)
      .enemyMoveset(MoveId.SPLASH);
  });

  // NB: Since switching moves bypass trapping, the only way fleeing can occur in PKR is from the player
  // TODO: Implement once forced flee helper exists
  it.todo("should interrupt player flee attempt and display message, unless user has Run Away");

  // TODO: Figure out how to wrangle the UI into not timing out
  it.todo("should interrupt player switch attempt and display message", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.DUGTRIO, SpeciesId.GOTHITELLE]);

    const enemy = game.field.getEnemyPokemon();

    game.doSwitchPokemon(1);
    game.onNextPrompt("CommandPhase", UiMode.PARTY, () => {
      // no switch out command should be queued due to arena trap
      expect(game.scene.currentBattle.turnCommands[0]).toBeNull();

      // back out and end the phase to avoid timeout
      console.log(game.scene.ui.getHandler().constructor.name);
      (game.scene.ui.getHandler() as PartyUiHandler).processInput(Button.CANCEL);
    });

    await game.phaseInterceptor.to("CommandPhase");

    expect(game.textInterceptor.logs).toContain(
      i18next.t("abilityTriggers:arenaTrap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        abilityName: allAbilities[AbilityId.ARENA_TRAP].name,
      }),
    );
  });

  it("should guarantee double battle with any one LURE", async () => {
    game.override.startingModifier([{ name: "LURE" }]).startingWave(2);
    await game.classicMode.startBattle([SpeciesId.DUGTRIO]);

    expect(game.scene.getEnemyField()).toHaveLength(2);
  });

  it("should lift if pokemon with this ability leaves the field", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.isTrapped()).toBe(true);
    expect(enemy.isOnField()).toBe(true);

    game.move.use(MoveId.ROAR);
    await game.toEndOfTurn();

    expect(player.isTrapped()).toBe(false);
    expect(enemy.isOnField()).toBe(false);
  });
});
