import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { FormChangeItem } from "#enums/form-change-item";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import { FormChangeItemModifierType } from "#modifiers/modifier-type";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Form Change Phase", () => {
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Zacian should successfully change into Crowned form", async () => {
    await game.classicMode.startBattle(SpeciesId.ZACIAN);

    // Before the form change: Should be Hero form
    const zacian = game.field.getPlayerPokemon();
    expect(zacian.getFormKey()).toBe("hero-of-many-battles");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 120, 115, 80, 115, 138]);

    // Give Zacian a Rusted Sword
    const rustedSwordType = generateModifierType(modifierTypes.RARE_FORM_CHANGE_ITEM)!;
    const rustedSword = rustedSwordType.newModifier(zacian);
    await game.scene.addModifier(rustedSword);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // After the form change: Should be Crowned form
    expect(game.phaseInterceptor.log.includes("FormChangePhase")).toBe(true);
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.getTypes()).toStrictEqual([PokemonType.FAIRY, PokemonType.STEEL]);
    expect(zacian.calculateBaseStats()).toStrictEqual([92, 150, 115, 80, 115, 148]);
  });

  it("Zamazenta should change to Crowned Shield form and learn Behemoth Bash", async () => {
    game.override.moveset([MoveId.IRON_HEAD, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL]);
    await game.classicMode.startBattle(SpeciesId.ZAMAZENTA);

    const zamazenta = game.field.getPlayerPokemon();
    expect(zamazenta.getFormKey()).toBe("hero-of-many-battles");

    const itemType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SHIELD);
    const item = itemType.newModifier(zamazenta);
    await game.scene.addModifier(item);

    game.move.select(MoveId.IRON_HEAD);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(zamazenta.getFormKey()).toBe("crowned");
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BASH)).toBe(true);
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(false);
  });

  it("Zamazenta should revert to default form and learn Iron Head if it knows Behemoth Bash", async () => {
    game.override
      .moveset([MoveId.BEHEMOTH_BASH, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL])
      .enemySpecies(SpeciesId.BLISSEY) // can survive a lot of rounds
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.ZAMAZENTA);

    const zamazenta = game.field.getPlayerPokemon();

    const itemType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SHIELD);
    const item = itemType.newModifier(zamazenta);
    await game.scene.addModifier(item);

    game.move.select(MoveId.BEHEMOTH_BASH);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(zamazenta.getFormKey()).toBe("crowned");

    const rustedShield = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(rustedShield);

    game.move.select(MoveId.BEHEMOTH_BASH);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(zamazenta.getFormKey()).toBe("hero-of-many-battles");
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(true);
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BASH)).toBe(false);
  });

  it("Necrozma should change to Dusk-Mane form and learn Sunsteel Strike replacing Confusion", async () => {
    game.override.moveset([MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    expect(necrozma.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    const itemType = new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER);
    const item = itemType.newModifier(necrozma);
    await game.scene.addModifier(item);

    game.move.select(MoveId.CONFUSION);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("dusk-mane");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(false);
  });

  it("Necrozma should change to Dawn Wings form and learn Moongeist Beam replacing Confusion", async () => {
    game.override.moveset([MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    const necrozma = game.field.getPlayerPokemon();
    expect(necrozma.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    const itemType = new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER);
    const item = itemType.newModifier(necrozma);
    await game.scene.addModifier(item);

    game.move.select(MoveId.CONFUSION);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("dawn-wings");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(false);
  });

  it("(Ultra) Necrozma should change to Dusk Mane form and try to learn Moongeist Beam", async () => {
    game.override
      .moveset([MoveId.SUNSTEEL_STRIKE, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    necrozma.formIndex = 1;
    await necrozma.updateInfo();

    const nSolarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER),
      necrozma.id,
      FormChangeItem.N_SOLARIZER,
      true,
    );
    game.scene.modifiers.push(nSolarizerModifier);

    const ultraType = new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z);
    await game.scene.addModifier(ultraType.newModifier(necrozma));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(3);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("ultra");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.NIGHT_SLASH)).toBe(false);
  });

  it("(Ultra) Necrozma should change to Dawn Wings form and try to learn Sunsteel Strike", async () => {
    game.override
      .moveset([MoveId.MOONGEIST_BEAM, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.LUNALA);
    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    necrozma.formIndex = 2;
    await necrozma.updateInfo();

    const nLunarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER),
      necrozma.id,
      FormChangeItem.N_LUNARIZER,
      true,
    );
    game.scene.modifiers.push(nLunarizerModifier);

    const ultraType = new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z);
    await game.scene.addModifier(ultraType.newModifier(necrozma));

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(3);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("ultra");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.NIGHT_SLASH)).toBe(false);
  });

  it("(Dusk Mane) Necrozma should replace Sunsteel Strike with Confusion when returned to default form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    // Define moveset with Sunsteel Strike
    game.move.changeMoveset(necrozma, [MoveId.SUNSTEEL_STRIKE, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);

    // Adds Solarizer modifier to change to Dusk-Mane
    const nSolarizerType = new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER);
    await game.scene.addModifier(nSolarizerType.newModifier(necrozma));

    // Change to Dusk-Mane
    game.move.select(MoveId.SUNSTEEL_STRIKE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(necrozma.getFormKey()).toBe("dusk-mane");

    // Remove the item to rever to base form
    const nSolarizer = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(nSolarizer);

    // Replace Sunsteel Strike with Confusion when trying to select it in base form
    game.move.select(MoveId.SUNSTEEL_STRIKE);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(false);
  });

  it("(Dawn Wings) Necrozma should replace Moongeist Beam with Confusion when returned to default form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    // Define moveset with Moongeist Beam
    game.move.changeMoveset(necrozma, [MoveId.MOONGEIST_BEAM, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);

    // Adds Lunarizer modifier to change to Dusk-Mane
    const nLunarizerType = new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER);
    await game.scene.addModifier(nLunarizerType.newModifier(necrozma));

    // Change toDawn-Wings
    game.move.select(MoveId.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(necrozma.getFormKey()).toBe("dawn-wings");

    // Remove the item
    const nLunarizer = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(nLunarizer);

    // Replace Moongeist Beam with Confusion when trying to select it in base form
    game.move.select(MoveId.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(necrozma.getFormKey()).toBe("");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(false);
  });

  it("(Dusk Mane) Ultra Necrozma should forget Moongeist Beam when returned to non ultra form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    // Forces Ultra directly
    necrozma.formIndex = 3;
    game.move.changeMoveset(necrozma, [
      MoveId.SUNSTEEL_STRIKE,
      MoveId.MOONGEIST_BEAM,
      MoveId.SLASH,
      MoveId.NIGHT_SLASH,
    ]);

    const nSolarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER),
      necrozma.id,
      FormChangeItem.N_SOLARIZER,
      true,
    );
    game.scene.modifiers.push(nSolarizerModifier);

    const ultraModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z),
      necrozma.id,
      FormChangeItem.ULTRANECROZIUM_Z,
      true,
    );
    game.scene.modifiers.push(ultraModifier);

    // Deactivate ULTRANECROZIUM_Z — reverts to Dusk-Mane
    ultraModifier.apply(necrozma, false);

    await game.phaseInterceptor.to("FormChangePhase");

    expect(necrozma.getFormKey()).toBe("dusk-mane");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(false);
  });

  it("(Dawn Wings) Necrozma should forget Sunsteel Strike when returned to non ultra form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.runToSummon(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    const necrozma = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    // Forces Ultra directly
    necrozma.formIndex = 3;
    game.move.changeMoveset(necrozma, [
      MoveId.SUNSTEEL_STRIKE,
      MoveId.MOONGEIST_BEAM,
      MoveId.SLASH,
      MoveId.NIGHT_SLASH,
    ]);

    const nLunarizerModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER),
      necrozma.id,
      FormChangeItem.N_LUNARIZER,
      true,
    );
    game.scene.modifiers.push(nLunarizerModifier);

    const ultraModifier = new PokemonFormChangeItemModifier(
      new FormChangeItemModifierType(FormChangeItem.ULTRANECROZIUM_Z),
      necrozma.id,
      FormChangeItem.ULTRANECROZIUM_Z,
      true,
    );
    game.scene.modifiers.push(ultraModifier);

    // Deactivate ULTRANECROZIUM_Z — reverts to Dusk-Mane
    ultraModifier.apply(necrozma, false);

    await game.phaseInterceptor.to("FormChangePhase");

    expect(necrozma.getFormKey()).toBe("dawn-wings");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(false);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
  });

  it("Calyrex should change to Ice Rider form and learn Glacial Lance", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    const itemType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const item = itemType.newModifier(calyrex);
    await game.scene.addModifier(item);

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("ice");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(false);
  });

  it("Calyrex should change to Shadow Rider form and learn Astral Barrage", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.SPECTRIER);

    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.SPECTRIER].caughtAttr = BigInt(1);

    const itemType = new FormChangeItemModifierType(FormChangeItem.SHADOW_REINS_OF_UNITY);
    const item = itemType.newModifier(calyrex);
    await game.scene.addModifier(item);

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("shadow");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.ASTRAL_BARRAGE)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(false);
  });

  it("Calyrex should forget form-specific moves when returning to default form", async () => {
    game.override
      .moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.GLACIAL_LANCE])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    // Change to Ice Rider form
    const itemType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const item = itemType.newModifier(calyrex);
    await game.scene.addModifier(item);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    // Remove the item to revert to base form
    const icyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(icyReins);

    // Revert to base form, GLACIAL_LANCE should be removed and not replaced with anything since there are still other moves left
    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("FormChangePhase");

    expect(calyrex.getFormKey()).toBe("");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(false);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(true);
  });

  it("Calyrex should learn Confusion if there are no more moves left after returning to default form", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    const calyrex = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    game.move.changeMoveset(calyrex, [MoveId.GLACIAL_LANCE]);

    // Changes to Ice Rider form
    const itemType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const item = itemType.newModifier(calyrex);
    await game.scene.addModifier(item);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    // Remove the item to revert to base form
    const icyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(icyReins);

    // Revert to base form, GLACIAL_LANCE should be removed and replaced with CONFUSION since there are no moves left
    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("LearnMovePhase");

    expect(calyrex.getFormKey()).toBe("");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(false);
  });
});
