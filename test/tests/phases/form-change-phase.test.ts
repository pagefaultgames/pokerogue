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

  it("Zacian should change to Crowned Sword form and learn Behemoth Blade if it knows Iron Head", async () => {
    game.override.moveset([MoveId.IRON_HEAD, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL]);
    await game.classicMode.startBattle(SpeciesId.ZACIAN);

    // Before the form change: Should be Hero form
    const zacian = game.field.getPlayerPokemon();
    expect(zacian.getFormKey()).toBe("hero-of-many-battles");

    // Give Zacian a Rusted Sword
    const rustedSwordType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SWORD);
    const rustedSword = rustedSwordType.newModifier(zacian);
    await game.scene.addModifier(rustedSword);

    game.move.select(MoveId.IRON_HEAD);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Crowned form and have Behemoth Blade instead of Iron Head
    expect(zacian.getFormKey()).toBe("crowned");
    expect(zacian.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BLADE)).toBe(true);
    expect(zacian.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(false);
  });

  it("Zacian should revert to default form and learn Iron Head if it knows Behemoth Blade", async () => {
    game.override
      .moveset([MoveId.BEHEMOTH_BLADE, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.ZACIAN);

    const zacian = game.field.getPlayerPokemon();

    const rustedSwordType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SWORD);
    const rustedSword = rustedSwordType.newModifier(zacian);
    await game.scene.addModifier(rustedSword);

    // Changed to Crowned form
    game.move.select(MoveId.BEHEMOTH_BLADE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(zacian.getFormKey()).toBe("crowned");

    // Remove the item to revert to Hero form
    const newRustedSword = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newRustedSword);

    game.move.select(MoveId.BEHEMOTH_BLADE);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Hero form and have Iron Head instead of Behemoth Blade
    expect(zacian.getFormKey()).toBe("hero-of-many-battles");
    expect(zacian.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(true);
    expect(zacian.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BLADE)).toBe(false);
  });

  it("Zamazenta should change to Crowned Shield form and learn Behemoth Bash", async () => {
    game.override.moveset([MoveId.IRON_HEAD, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL]);
    await game.classicMode.startBattle(SpeciesId.ZAMAZENTA);

    // Before the form change: Should be Hero form
    const zamazenta = game.field.getPlayerPokemon();
    expect(zamazenta.getFormKey()).toBe("hero-of-many-battles");

    // Give Zamazenta a Rusted Shield
    const rustedShieldType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SHIELD);
    const rustedShield = rustedShieldType.newModifier(zamazenta);
    await game.scene.addModifier(rustedShield);

    game.move.select(MoveId.IRON_HEAD);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Crowned form and have Behemoth Bash instead of Iron Head
    expect(zamazenta.getFormKey()).toBe("crowned");
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BASH)).toBe(true);
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(false);
  });

  it("Zamazenta should revert to default form and learn Iron Head if it knows Behemoth Bash", async () => {
    game.override
      .moveset([MoveId.BEHEMOTH_BASH, MoveId.SLASH, MoveId.CRUNCH, MoveId.HOWL])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.ZAMAZENTA);

    const zamazenta = game.field.getPlayerPokemon();

    const rustedShieldType = new FormChangeItemModifierType(FormChangeItem.RUSTED_SHIELD);
    const rustedShield = rustedShieldType.newModifier(zamazenta);
    await game.scene.addModifier(rustedShield);

    // Change to Crowned form
    game.move.select(MoveId.BEHEMOTH_BASH);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(zamazenta.getFormKey()).toBe("crowned");

    // Remove the item to revert to Hero form
    const newRustedShield = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newRustedShield);

    game.move.select(MoveId.BEHEMOTH_BASH);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Hero form and have Iron Head instead of Behemoth Bash
    expect(zamazenta.getFormKey()).toBe("hero-of-many-battles");
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.IRON_HEAD)).toBe(true);
    expect(zamazenta.moveset.some(m => m?.moveId === MoveId.BEHEMOTH_BASH)).toBe(false);
  });

  it("Necrozma should change to Dusk-Mane form and learn Sunsteel Strike replacing Confusion", async () => {
    game.override.moveset([MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.SOLGALEO);

    // Before the form change: Should be base form
    const necrozma = game.field.getPlayerPokemon();
    expect(necrozma.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.SOLGALEO].caughtAttr = BigInt(1);

    // Give Necrozma an N-Solarizer
    const nSolarizerType = new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER);
    const nSolarizer = nSolarizerType.newModifier(necrozma);
    await game.scene.addModifier(nSolarizer);

    game.move.select(MoveId.CONFUSION);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Dusk-Mane form and have Sunsteel Strike instead of Confusion
    expect(necrozma.getFormKey()).toBe("dusk-mane");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(true);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(false);
  });

  it("Necrozma should change to Dawn Wings form and learn Moongeist Beam replacing Confusion", async () => {
    game.override.moveset([MoveId.CONFUSION, MoveId.METAL_CLAW, MoveId.SLASH, MoveId.NIGHT_SLASH]);
    await game.classicMode.startBattle(SpeciesId.NECROZMA, SpeciesId.LUNALA);

    // Before the form change: Should be base form
    const necrozma = game.field.getPlayerPokemon();
    expect(necrozma.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.LUNALA].caughtAttr = BigInt(1);

    // Give Necrozma an N-Lunarizer
    const nLunarizerType = new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER);
    const nLunarizer = nLunarizerType.newModifier(necrozma);
    await game.scene.addModifier(nLunarizer);

    game.move.select(MoveId.CONFUSION);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Dawn-Wings form and have Moongeist Beam instead of Confusion
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

    // Change to Ultra form and select Night Slash to be replaced by Moongeist Beam
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

    // After form change: Should be Ultra form and have both Sunsteel Strike and Moongeist Beam
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

    // Change to Ultra form and select Night Slash to be replaced by Sunsteel Strike
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

    // After form change: Should be Ultra form and have both Sunsteel Strike and Moongeist Beam
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

    const nSolarizerType = new FormChangeItemModifierType(FormChangeItem.N_SOLARIZER);
    await game.scene.addModifier(nSolarizerType.newModifier(necrozma));

    // Change to Dusk-Mane
    game.move.select(MoveId.SUNSTEEL_STRIKE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(necrozma.getFormKey()).toBe("dusk-mane");

    // Remove the item to revert to base form
    const nSolarizer = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(nSolarizer);

    game.move.select(MoveId.SUNSTEEL_STRIKE);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After form change: Should be base form and have Confusion instead of Sunsteel Strike
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

    const nLunarizerType = new FormChangeItemModifierType(FormChangeItem.N_LUNARIZER);
    await game.scene.addModifier(nLunarizerType.newModifier(necrozma));

    // Change to Dawn-Wings
    game.move.select(MoveId.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(necrozma.getFormKey()).toBe("dawn-wings");

    // Remove the item to revert to base form
    const nLunarizer = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(nLunarizer);

    game.move.select(MoveId.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After form change: Should be base form and have Confusion instead of Moongeist Beam
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

    // After form change: Should be Dusk-Mane form and have Sunsteel Strike but not Moongeist Beam
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

    // After form change: Should be Dawn-Wings form and have Moongeist Beam but not Sunsteel Strike
    expect(necrozma.getFormKey()).toBe("dawn-wings");
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.SUNSTEEL_STRIKE)).toBe(false);
    expect(necrozma.moveset.some(m => m?.moveId === MoveId.MOONGEIST_BEAM)).toBe(true);
  });

  it("Calyrex should change to Ice Rider form and learn Glacial Lance", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.GLASTRIER);

    // Before the form change: Should be base form
    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.GLASTRIER].caughtAttr = BigInt(1);

    // Give Calyrex Icy Reins of Unity
    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const icyReins = icyReinsType.newModifier(calyrex);
    await game.scene.addModifier(icyReins);

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Ice Rider form and have Glacial Lance instead of Pound
    expect(calyrex.getFormKey()).toBe("ice");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.POUND)).toBe(false);
  });

  it("Calyrex should change to Shadow Rider form and learn Astral Barrage", async () => {
    game.override.moveset([MoveId.POUND, MoveId.TACKLE, MoveId.STOMP, MoveId.SWORDS_DANCE]);
    await game.classicMode.runToSummon(SpeciesId.CALYREX, SpeciesId.SPECTRIER);

    // Before the form change: Should be base form
    const calyrex = game.field.getPlayerPokemon();
    expect(calyrex.getFormKey()).toBe("");

    game.scene.gameData.dexData[SpeciesId.SPECTRIER].caughtAttr = BigInt(1);

    // Give Calyrex Shadow Reins of Unity
    const shadowReinsType = new FormChangeItemModifierType(FormChangeItem.SHADOW_REINS_OF_UNITY);
    const shadowReins = shadowReinsType.newModifier(calyrex);
    await game.scene.addModifier(shadowReins);

    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(0);
      game.scene.ui.processInput(Button.ACTION);
    });

    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Shadow Rider form and have Astral Barrage instead of Pound
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
    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const icyReins = icyReinsType.newModifier(calyrex);
    await game.scene.addModifier(icyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    // Remove the item to revert to base form
    const newIcyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newIcyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("FormChangePhase");

    // After form change: Should be base form and have Pound but not Glacial Lance
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

    // Change to Ice Rider form
    const icyReinsType = new FormChangeItemModifierType(FormChangeItem.ICY_REINS_OF_UNITY);
    const icyReins = icyReinsType.newModifier(calyrex);
    await game.scene.addModifier(icyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(calyrex.getFormKey()).toBe("ice");

    // Remove the item to revert to base form
    const newIcyReins = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newIcyReins);

    game.move.select(MoveId.GLACIAL_LANCE);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After form change: Should be base form and have Confusion since there are no moves left, and not have Glacial Lance
    expect(calyrex.getFormKey()).toBe("");
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.CONFUSION)).toBe(true);
    expect(calyrex.moveset.some(m => m?.moveId === MoveId.GLACIAL_LANCE)).toBe(false);
  });

  it("Hoopa should change to Unbound form and learn Hyperspace Fury if it knows Hyperspace Hole", async () => {
    game.override.moveset([MoveId.HYPERSPACE_HOLE, MoveId.CONFUSION, MoveId.LIGHT_SCREEN, MoveId.DARK_PULSE]);
    await game.classicMode.startBattle(SpeciesId.HOOPA);

    // Before the form change: Should be base form
    const hoopa = game.field.getPlayerPokemon();
    expect(hoopa.getFormKey()).toBe("");

    // Give Hoopa a Prison Bottle
    const prisonBottleType = new FormChangeItemModifierType(FormChangeItem.PRISON_BOTTLE);
    const prisonBottle = prisonBottleType.newModifier(hoopa);
    await game.scene.addModifier(prisonBottle);

    game.move.select(MoveId.HYPERSPACE_HOLE);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be Unbound form
    expect(hoopa.getFormKey()).toBe("unbound");
    expect(hoopa.moveset.some(m => m?.moveId === MoveId.HYPERSPACE_FURY)).toBe(true);
    expect(hoopa.moveset.some(m => m?.moveId === MoveId.HYPERSPACE_HOLE)).toBe(false);
  });

  it("Hoopa should revert to default form and learn Hyperspace Hole if it knows Hyperspace Fury", async () => {
    game.override
      .moveset([MoveId.HYPERSPACE_FURY, MoveId.CONFUSION, MoveId.LIGHT_SCREEN, MoveId.DARK_PULSE])
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.HOOPA);

    const hoopa = game.field.getPlayerPokemon();

    const prisonBottleType = new FormChangeItemModifierType(FormChangeItem.PRISON_BOTTLE);
    const prisonType = prisonBottleType.newModifier(hoopa);
    await game.scene.addModifier(prisonType);

    // Change to Unbound form
    game.move.select(MoveId.HYPERSPACE_FURY);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(hoopa.getFormKey()).toBe("unbound");

    // Remove the item to revert to base form
    const newPrisonBottle = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newPrisonBottle);

    game.move.select(MoveId.HYPERSPACE_FURY);
    await game.phaseInterceptor.to("LearnMovePhase");

    // After the form change: Should be base form
    expect(hoopa.getFormKey()).toBe("");
    expect(hoopa.moveset.some(m => m?.moveId === MoveId.HYPERSPACE_HOLE)).toBe(true);
    expect(hoopa.moveset.some(m => m?.moveId === MoveId.HYPERSPACE_FURY)).toBe(false);
  });

  it("Kyurem should change to Black form and learn Fusion Bolt and Freeze Shock replacing Scary Face and Glaciate", async () => {
    await game.classicMode.startBattle(SpeciesId.KYUREM, SpeciesId.ZEKROM);

    // Before the form change: Should be base form
    const kyurem = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.ZEKROM].caughtAttr = BigInt(1);
    expect(kyurem.getFormKey()).toBe("");

    game.move.changeMoveset(kyurem, [MoveId.SCARY_FACE, MoveId.GLACIATE, MoveId.BLIZZARD, MoveId.DRAGON_BREATH]);

    // Give Kyurem a Dark Stone
    const darkStoneType = new FormChangeItemModifierType(FormChangeItem.DARK_STONE);
    const darkStone = darkStoneType.newModifier(kyurem);
    await game.scene.addModifier(darkStone);

    game.move.select(MoveId.SCARY_FACE);
    await game.phaseInterceptor.to("TurnInitPhase");

    // After the form change: Should be Black form
    expect(kyurem.getFormKey()).toBe("black");
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FUSION_BOLT)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FREEZE_SHOCK)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.SCARY_FACE)).toBe(false);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.GLACIATE)).toBe(false);
  });

  it("Kyurem should change to White form and learn Fusion Flare and Ice Burn replacing Scary Face and Glaciate", async () => {
    await game.classicMode.startBattle(SpeciesId.KYUREM, SpeciesId.RESHIRAM);

    // Before the form change: Should be base form
    const kyurem = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.RESHIRAM].caughtAttr = BigInt(1);
    expect(kyurem.getFormKey()).toBe("");

    game.move.changeMoveset(kyurem, [MoveId.SCARY_FACE, MoveId.GLACIATE, MoveId.BLIZZARD, MoveId.DRAGON_BREATH]);

    // Give Kyurem a Light Stone
    const lightStoneType = new FormChangeItemModifierType(FormChangeItem.LIGHT_STONE);
    const lightStone = lightStoneType.newModifier(kyurem);
    await game.scene.addModifier(lightStone);

    game.move.select(MoveId.SCARY_FACE);
    await game.phaseInterceptor.to("TurnInitPhase");

    // After the form change: Should be White form
    expect(kyurem.getFormKey()).toBe("white");
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FUSION_FLARE)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.ICE_BURN)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.SCARY_FACE)).toBe(false);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.GLACIATE)).toBe(false);
  });

  it("Black Kyurem should revert to default form and learn Scary Face and Glaciate", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.KYUREM, SpeciesId.ZEKROM);

    const kyurem = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.ZEKROM].caughtAttr = BigInt(1);

    const darkStoneType = new FormChangeItemModifierType(FormChangeItem.DARK_STONE);
    const darkStone = darkStoneType.newModifier(kyurem);
    await game.scene.addModifier(darkStone);

    game.move.changeMoveset(kyurem, [MoveId.FUSION_BOLT, MoveId.FREEZE_SHOCK, MoveId.ICY_WIND, MoveId.DRAGON_BREATH]);

    // Change to Black form
    game.move.select(MoveId.FUSION_BOLT);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(kyurem.getFormKey()).toBe("black");

    // Remove the item to revert to base form
    const newDarkStone = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newDarkStone);

    game.move.select(MoveId.FUSION_BOLT);
    await game.phaseInterceptor.to("TurnInitPhase");

    // After the form change: Should be base form
    expect(kyurem.getFormKey()).toBe("");
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.SCARY_FACE)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.GLACIATE)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FUSION_BOLT)).toBe(false);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FREEZE_SHOCK)).toBe(false);
  });

  it("White Kyurem should revert to default form and learn Scary Face and Glaciate", async () => {
    game.override.enemySpecies(SpeciesId.BLISSEY).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.KYUREM, SpeciesId.RESHIRAM);

    const kyurem = game.field.getPlayerPokemon();
    game.scene.gameData.dexData[SpeciesId.RESHIRAM].caughtAttr = BigInt(1);

    const lightStoneType = new FormChangeItemModifierType(FormChangeItem.LIGHT_STONE);
    const lightStone = lightStoneType.newModifier(kyurem);
    await game.scene.addModifier(lightStone);

    game.move.changeMoveset(kyurem, [MoveId.FUSION_FLARE, MoveId.ICE_BURN, MoveId.ICY_WIND, MoveId.DRAGON_BREATH]);

    // Change to White form
    game.move.select(MoveId.FUSION_FLARE);
    await game.phaseInterceptor.to("TurnInitPhase");
    expect(kyurem.getFormKey()).toBe("white");

    // Remove the item to revert to base form
    const newLightStone = game.scene.findModifiers(
      m => m instanceof PokemonFormChangeItemModifier,
    )[0] as PokemonFormChangeItemModifier;
    game.scene.removeModifier(newLightStone);

    game.move.select(MoveId.FUSION_FLARE);
    await game.phaseInterceptor.to("TurnInitPhase");

    // After the form change: Should be base form
    expect(kyurem.getFormKey()).toBe("");
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.SCARY_FACE)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.GLACIATE)).toBe(true);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.FUSION_FLARE)).toBe(false);
    expect(kyurem.moveset.some(m => m?.moveId === MoveId.ICE_BURN)).toBe(false);
  });
});
