import { StatusEffect } from "#app/data/status-effect";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { MessagePhase } from "#app/phases/message-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import i18next, { initI18n } from "#app/plugins/i18n";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Items - Toxic orb", () => {
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
    const moveToUse = Moves.GROWTH;
    const oppMoveToUse = Moves.TACKLE;
    game.override.battleType("single");
    game.override.enemySpecies(Species.RATTATA);
    game.override.ability(Abilities.INSOMNIA);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.startingLevel(2000);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([oppMoveToUse, oppMoveToUse, oppMoveToUse, oppMoveToUse]);
    game.override.startingHeldItems([{
      name: "TOXIC_ORB",
    }]);
  });

  it("TOXIC ORB", async () => {
    initI18n();
    i18next.changeLanguage("en");
    const moveToUse = Moves.GROWTH;
    await game.startBattle([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    expect(game.scene.modifiers[0].type.id).toBe("TOXIC_ORB");

    game.move.select(moveToUse);

    // will run the 13 phase from enemyCommandPhase to TurnEndPhase
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    // Toxic orb should trigger here
    await game.phaseInterceptor.run(MessagePhase);
    const message = game.textInterceptor.getLatestMessage();
    expect(message).toContain("was badly poisoned by the Toxic Orb");
    await game.phaseInterceptor.run(MessagePhase);
    const message2 = game.textInterceptor.getLatestMessage();
    expect(message2).toContain("is hurt");
    expect(message2).toContain("by poison");
    expect(game.scene.getParty()[0].status!.effect).toBe(StatusEffect.TOXIC);
  }, 20000);
});
