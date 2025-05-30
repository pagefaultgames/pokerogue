import { allAbilities } from "#app/data/data-lists";
import { getPokemonNameWithAffix } from "#app/messages";
import type CommandUiHandler from "#app/ui/command-ui-handler";
import { Abilities } from "#enums/abilities";
import { Button } from "#enums/buttons";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

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
      .moveset([Moves.SPLASH, Moves.TELEPORT])
      .ability(Abilities.ARENA_TRAP)
      .enemySpecies(Species.RALTS)
      .enemyAbility(Abilities.ARENA_TRAP)
      .enemyMoveset(Moves.SPLASH);
  });

  // NB: Since switching moves bypass trapping, the only way fleeing can occur is from the player
  // TODO: Implement once forced flee helper exists
  it.todo("should interrupt player flee attempt and display message, unless user has Run Away", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.DUGTRIO, Species.GOTHITELLE]);

    const enemy = game.scene.getEnemyPokemon()!;

    // flee stuff goes here

    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      // no switch out command should be queued due to arena trap
      expect(game.scene.currentBattle.turnCommands[0]).toBeNull();

      // back out and cancel the flee to avoid timeout
      (game.scene.ui.getHandler() as CommandUiHandler).processInput(Button.CANCEL);
      game.move.select(Moves.SPLASH);
    });

    await game.toNextTurn();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("abilityTriggers:arenaTrap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        abilityName: allAbilities[Abilities.ARENA_TRAP].name,
      }),
    );
  });

  it("should interrupt player switch attempt and display message", async () => {
    game.override.battleStyle("single").enemyAbility(Abilities.ARENA_TRAP);

    await game.classicMode.startBattle([Species.DUGTRIO, Species.GOTHITELLE]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.doSwitchPokemon(1);
    game.onNextPrompt("CommandPhase", UiMode.PARTY, () => {
      // no switch out command should be queued due to arena trap
      expect(game.scene.currentBattle.turnCommands[0]).toBeNull();

      // back out and cancel the switch to avoid timeout
      (game.scene.ui.getHandler() as CommandUiHandler).processInput(Button.CANCEL);
      game.move.select(Moves.SPLASH);
    });

    await game.toNextTurn();
    expect(game.textInterceptor.logs).toContain(
      i18next.t("abilityTriggers:arenaTrap", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        abilityName: allAbilities[Abilities.ARENA_TRAP].name,
      }),
    );
  });

  it("should guarantee double battle with any one LURE", async () => {
    game.override.startingModifier([{ name: "LURE" }]).startingWave(2);
    await game.classicMode.startBattle([Species.DUGTRIO]);

    expect(game.scene.getEnemyField()).toHaveLength(2);
  });

  it("should lift if pokemon with this ability leaves the field", async () => {
    game.override.battleStyle("single").enemyMoveset(Moves.SPLASH).moveset(Moves.ROAR);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.isTrapped()).toBe(true);
    expect(enemy.isOnField()).toBe(true);

    game.move.select(Moves.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.isTrapped()).toBe(false);
    expect(enemy.isOnField()).toBe(false);
  });
});
