import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import { getEggTierForSpecies } from "#data/egg";
import { GrowthRate, getGrowthRateColor } from "#data/exp";
import type { PokemonSpecies } from "#data/pokemon-species";
import { Challenges } from "#enums/challenges";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { getVariantIcon, getVariantTint, type Variant } from "#sprites/variant";
import type { DexAttrProps, StarterPreferences } from "#system/game-data";
import { type BooleanHolder, getLocalizedSpriteKey, isNullOrUndefined, padInt, rgbHexToRgba } from "#utils/common";
import { getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import type { GameObjects } from "phaser";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { getFriendship, getSpeciesData, getStarterSelectTextSettings } from "./starter-select-ui-utils";
import { StatsContainer } from "./stats-container";
import { addBBCodeTextObject, addTextObject } from "./text";

export class StarterSummary extends Phaser.GameObjects.Container {
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonNameText: Phaser.GameObjects.Text;
  private pokemonGrowthRateLabelText: Phaser.GameObjects.Text;
  private pokemonGrowthRateText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private pokemonLuckLabelText: Phaser.GameObjects.Text;
  private pokemonLuckText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonUncaughtText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonPassiveLabelText: Phaser.GameObjects.Text;
  private pokemonPassiveText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
  private pokemonMovesContainer: Phaser.GameObjects.Container;
  private pokemonMoveContainers: Phaser.GameObjects.Container[];
  private pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonMoveLabels: Phaser.GameObjects.Text[];
  private pokemonAdditionalMoveCountLabel: Phaser.GameObjects.Text;
  private eggMovesLabel: Phaser.GameObjects.Text;
  private pokemonEggMovesContainer: Phaser.GameObjects.Container;
  private pokemonEggMoveContainers: Phaser.GameObjects.Container[];
  private pokemonEggMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonEggMoveLabels: Phaser.GameObjects.Text[];
  private pokemonCandyContainer: Phaser.GameObjects.Container;
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonFormText: Phaser.GameObjects.Text;
  private pokemonHatchedIcon: Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveDisabledIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveLockedIcon: Phaser.GameObjects.Sprite;
  private teraIcon: Phaser.GameObjects.Sprite;

  private statsContainer: StatsContainer;
  private statsMode = false;

  private assetLoadCancelled: BooleanHolder | null;

  private pokemonPermanentInfoContainer: GameObjects.Container;
  private pokemonStatisticsContainer: GameObjects.Container;
  private pokemonPreferencesContainer: GameObjects.Container;

  constructor(x: number, y: number) {
    super(globalScene, x, y);

    this.pokemonSprite = globalScene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
    });

    this.pokemonNumberText = addTextObject(17, 1, "0000", TextStyle.SUMMARY_DEX_NUM).setOrigin(0);

    this.pokemonNameText = addTextObject(6, 112, "", TextStyle.SUMMARY).setOrigin(0);

    this.pokemonUncaughtText = addTextObject(
      6,
      127,
      i18next.t("starterSelectUiHandler:uncaught"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "56px" },
    ).setOrigin(0);

    this.pokemonMoveContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    this.pokemonEggMoveContainers = [];
    this.pokemonEggMoveBgs = [];
    this.pokemonEggMoveLabels = [];

    this.pokemonPreferencesContainer = this.setupPokemonPreferencesContainer();
    this.pokemonPermanentInfoContainer = this.setupPokemonPermanentInfoContainer();
    this.pokemonStatisticsContainer = this.setupPokemonStatisticsContainer();

    for (let m = 0; m < 4; m++) {
      const moveContainer = globalScene.add.container(0, 14 * m);

      const moveBg = globalScene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(-moveBg.width / 2, 0, "-", TextStyle.MOVE_LABEL);
      moveLabel.setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add([moveBg, moveLabel]);

      this.pokemonMoveContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.pokemonAdditionalMoveCountLabel = addTextObject(
      -this.pokemonMoveBgs[0].width / 2,
      56,
      "(+0)",
      TextStyle.MOVE_LABEL,
    ).setOrigin(0.5, 0);

    this.pokemonMovesContainer.add(this.pokemonAdditionalMoveCountLabel);

    this.pokemonEggMovesContainer = globalScene.add.container(102, 85).setScale(0.375);

    this.eggMovesLabel = addTextObject(
      -46,
      0,
      i18next.t("starterSelectUiHandler:eggMoves"),
      TextStyle.WINDOW_ALT,
    ).setOrigin(0.5, 0);

    this.pokemonEggMovesContainer.add(this.eggMovesLabel);

    for (let m = 0; m < 4; m++) {
      const eggMoveContainer = globalScene.add.container(0, 16 + 14 * m);

      const eggMoveBg = globalScene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      eggMoveBg.setOrigin(1, 0);

      const eggMoveLabel = addTextObject(-eggMoveBg.width / 2, 0, "???", TextStyle.MOVE_LABEL);
      eggMoveLabel.setOrigin(0.5, 0);

      this.pokemonEggMoveBgs.push(eggMoveBg);
      this.pokemonEggMoveLabels.push(eggMoveLabel);

      eggMoveContainer.add([eggMoveBg, eggMoveLabel]);

      this.pokemonEggMoveContainers.push(eggMoveContainer);

      this.pokemonEggMovesContainer.add(eggMoveContainer);
    }

    this.statsContainer = new StatsContainer(6, 16).setVisible(false);

    globalScene.add.existing(this.statsContainer);

    this.add([
      this.pokemonSprite,
      this.pokemonNumberText,
      this.pokemonNameText,
      this.pokemonUncaughtText,
      this.pokemonPreferencesContainer,
      this.pokemonPermanentInfoContainer,
      this.pokemonStatisticsContainer,
      this.pokemonMovesContainer,
      this.pokemonEggMovesContainer,
      this.statsContainer,
    ]);
  }

  setupPokemonPreferencesContainer(): GameObjects.Container {
    const pokemonPreferencesContainer = globalScene.add.container(0, 0);

    const textSettings = getStarterSelectTextSettings();

    // The position should be set per language
    const starterInfoXPos = textSettings?.starterInfoXPos || 31;
    const starterInfoYOffset = textSettings?.starterInfoYOffset || 0;

    // The font size should be set per language
    const starterInfoTextSize = textSettings?.starterInfoTextSize || 56;

    this.pokemonGenderText = addTextObject(96, 112, "", TextStyle.SUMMARY_ALT).setOrigin(0);

    this.pokemonFormText = addTextObject(6, 42, "Form", TextStyle.WINDOW_ALT, {
      fontSize: "42px",
    }).setOrigin(0);

    this.pokemonAbilityLabelText = addTextObject(
      6,
      127 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:ability"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ).setOrigin(0);

    this.pokemonAbilityText = addTextObject(starterInfoXPos, 127 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveLabelText = addTextObject(
      6,
      136 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:passive"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ).setOrigin(0);

    this.pokemonPassiveText = addTextObject(starterInfoXPos, 136 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveDisabledIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_stop")
      .setOrigin(0, 0.5)
      .setScale(0.35)
      .setVisible(false);

    this.pokemonPassiveLockedIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_lock")
      .setOrigin(0, 0.5)
      .setScale(0.42, 0.38)
      .setVisible(false);

    this.pokemonNatureLabelText = addTextObject(
      6,
      145 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:nature"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ).setOrigin(0);

    this.pokemonNatureText = addBBCodeTextObject(starterInfoXPos, 145 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    }).setOrigin(0);

    this.pokemonShinyIcon = globalScene.add.sprite(12, 0, "shiny_icons").setScale(0.5);

    this.teraIcon = globalScene.add.sprite(85, 63, "button_tera").setName("terastallize-icon").setFrame("fire");

    pokemonPreferencesContainer.add([
      this.pokemonGenderText,
      this.pokemonFormText,
      this.pokemonAbilityLabelText,
      this.pokemonAbilityText,
      this.pokemonPassiveLabelText,
      this.pokemonPassiveText,
      this.pokemonPassiveDisabledIcon,
      this.pokemonPassiveLockedIcon,
      this.pokemonNatureLabelText,
      this.pokemonNatureText,
      this.pokemonShinyIcon,
      this.teraIcon,
    ]);

    return pokemonPreferencesContainer;
  }

  setupPokemonPermanentInfoContainer(): GameObjects.Container {
    const pokemonPermanentInfoContainer = globalScene.add.container(0, 0);

    this.type1Icon = globalScene.add.sprite(8, 98, getLocalizedSpriteKey("types")).setScale(0.5).setOrigin(0);
    this.type2Icon = globalScene.add.sprite(26, 98, getLocalizedSpriteKey("types")).setScale(0.5).setOrigin(0);

    this.pokemonGrowthRateLabelText = addTextObject(
      8,
      106,
      i18next.t("starterSelectUiHandler:growthRate"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "36px" },
    ).setOrigin(0);

    this.pokemonGrowthRateText = addTextObject(34, 106, "", TextStyle.GROWTH_RATE_TYPE, { fontSize: "36px" }).setOrigin(
      0,
    );

    this.pokemonLuckLabelText = addTextObject(8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, {
      fontSize: "56px",
    }).setOrigin(0);

    this.pokemonLuckText = addTextObject(
      8 + this.pokemonLuckLabelText.displayWidth + 2,
      89,
      "0",
      TextStyle.LUCK_VALUE,
      { fontSize: "56px" },
    ).setOrigin(0);

    pokemonPermanentInfoContainer.add([
      this.type1Icon,
      this.type2Icon,
      this.pokemonGrowthRateLabelText,
      this.pokemonGrowthRateText,
      this.pokemonLuckLabelText,
      this.pokemonLuckText,
    ]);

    return pokemonPermanentInfoContainer;
  }

  setupPokemonStatisticsContainer(): GameObjects.Container {
    const pokemonStatisticsContainer = globalScene.add.container(0, 0);

    // Candy icon and count
    this.pokemonCandyContainer = globalScene.add
      .container(4.5, 18)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.pokemonCandyIcon = globalScene.add.sprite(0, 0, "candy").setScale(0.5).setOrigin(0);
    this.pokemonCandyOverlayIcon = globalScene.add.sprite(0, 0, "candy_overlay").setScale(0.5).setOrigin(0);
    this.pokemonCandyDarknessOverlay = globalScene.add
      .sprite(0, 0, "candy")
      .setScale(0.5)
      .setOrigin(0)
      .setTint(0x000000)
      .setAlpha(0.5);

    this.pokemonCandyCountText = addTextObject(9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" }).setOrigin(0);
    this.pokemonCandyContainer.add([
      this.pokemonCandyIcon,
      this.pokemonCandyOverlayIcon,
      this.pokemonCandyDarknessOverlay,
      this.pokemonCandyCountText,
    ]);

    this.pokemonCaughtHatchedContainer = globalScene.add.container(2, 25).setScale(0.5);

    const pokemonCaughtIcon = globalScene.add.sprite(1, 0, "items", "pb").setOrigin(0).setScale(0.75);

    this.pokemonCaughtCountText = addTextObject(24, 4, "0", TextStyle.SUMMARY_ALT).setOrigin(0);
    this.pokemonHatchedIcon = globalScene.add.sprite(1, 14, "egg_icons").setOrigin(0.15, 0.2).setScale(0.8);
    this.pokemonHatchedCountText = addTextObject(24, 19, "0", TextStyle.SUMMARY_ALT).setOrigin(0);
    this.pokemonMovesContainer = globalScene.add.container(102, 16).setScale(0.375);
    this.pokemonCaughtHatchedContainer.add([
      pokemonCaughtIcon,
      this.pokemonCaughtCountText,
      this.pokemonHatchedIcon,
      this.pokemonHatchedCountText,
    ]);

    pokemonStatisticsContainer.add([this.pokemonCandyContainer, this.pokemonCaughtHatchedContainer]);

    return pokemonStatisticsContainer;
  }

  applyChallengeVisibility() {
    const notFreshStart = !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);

    for (const container of this.pokemonEggMoveContainers) {
      container.setVisible(notFreshStart);
    }
    this.eggMovesLabel.setVisible(notFreshStart);
    // This is not enough, we need individual checks in setStarterSpecies too! :)
    this.pokemonPassiveDisabledIcon.setVisible(notFreshStart);
    this.pokemonPassiveLabelText.setVisible(notFreshStart);
    this.pokemonPassiveLockedIcon.setVisible(notFreshStart);
    this.pokemonPassiveText.setVisible(notFreshStart);
  }

  updateName(name: string) {
    this.pokemonNameText.setText(name);
  }

  updateCandyCount(count: number) {
    this.pokemonCandyCountText.setText(`×${count}`);
  }

  setNameAndNumber(species: PokemonSpecies, starterPreferences: StarterPreferences) {
    this.pokemonNumberText.setText(padInt(species.speciesId, 4));

    if (starterPreferences?.nickname) {
      const name = decodeURIComponent(escape(atob(starterPreferences.nickname)));
      this.pokemonNameText.setText(name);
    } else {
      this.pokemonNameText.setText(species.name);
    }
  }

  setTypeIcons(type1: PokemonType | null, type2: PokemonType | null): void {
    if (type1 !== null) {
      this.type1Icon.setVisible(true).setFrame(PokemonType[type1].toLowerCase());
    } else {
      this.type1Icon.setVisible(false);
    }
    if (type2 !== null) {
      this.type2Icon.setVisible(true).setFrame(PokemonType[type2].toLowerCase());
    } else {
      this.type2Icon.setVisible(false);
    }
  }

  setSpecies(species: PokemonSpecies, starterPreferences: StarterPreferences) {
    // First, we load from the dex entry to get defaults
    const { dexEntry } = getSpeciesData(species.speciesId);

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    // Hiding ivs container if the species is not caught
    if (this.statsMode) {
      if (dexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats(species);
      } else {
        this.statsContainer.setVisible(false);
      }
    }

    if (dexEntry.caughtAttr) {
      this.setNameAndNumber(species, starterPreferences);

      const colorScheme = starterColors[species.speciesId];

      this.pokemonUncaughtText.setVisible(false);
      this.pokemonPermanentInfoContainer.setVisible(true);
      this.pokemonStatisticsContainer.setVisible(true);

      const luck = globalScene.gameData.getDexAttrLuck(dexEntry.caughtAttr);
      this.pokemonLuckText
        .setVisible(!!luck)
        .setText(luck.toString())
        .setTint(getVariantTint(Math.min(luck - 1, 2) as Variant));
      this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);

      //Growth translate
      let growthReadable = toTitleCase(GrowthRate[species.growthRate]);
      const growthAux = toCamelCase(growthReadable);
      if (i18next.exists("growth:" + growthAux)) {
        growthReadable = i18next.t(("growth:" + growthAux) as any);
      }
      this.pokemonGrowthRateText
        .setText(growthReadable)
        .setColor(getGrowthRateColor(species.growthRate))
        .setShadowColor(getGrowthRateColor(species.growthRate, true));
      this.pokemonCaughtCountText.setText(`${dexEntry.caughtCount}`);
      if (species.speciesId === SpeciesId.MANAPHY || species.speciesId === SpeciesId.PHIONE) {
        this.pokemonHatchedIcon.setFrame("manaphy");
      } else {
        this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
      }
      this.pokemonHatchedCountText.setText(`${dexEntry.hatchedCount}`);

      const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
      const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
      const variant = defaultProps.variant;
      const tint = getVariantTint(variant);
      this.pokemonShinyIcon.setFrame(getVariantIcon(variant)).setTint(tint).setVisible(defaultProps.shiny);

      if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
        this.pokemonCaughtHatchedContainer.setVisible(false);
        this.pokemonShinyIcon.setY(104).setFrame(getVariantIcon(variant));
        this.pokemonFormText.setY(25);
      } else {
        this.pokemonCaughtHatchedContainer.setVisible(true);
        this.pokemonShinyIcon.setY(86);
        this.pokemonCandyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
        this.pokemonCandyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));
        this.pokemonCandyCountText.setText(`×${globalScene.gameData.starterData[species.speciesId].candyCount}`);
        this.pokemonFormText.setY(42);
        this.pokemonHatchedIcon.setVisible(true);
        this.pokemonHatchedCountText.setVisible(true);

        const { currentFriendship, friendshipCap } = getFriendship(species.speciesId);
        const candyCropY = 16 - 16 * (currentFriendship / friendshipCap);
        this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);

        this.pokemonCandyContainer
          .setVisible(true)
          .on("pointerover", () => {
            globalScene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true);
            this.activeTooltip = "CANDY";
          })
          .on("pointerout", () => {
            globalScene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
      }

      let props: DexAttrProps;

      const defaultAbilityIndex =
        starterPreferences?.ability ?? globalScene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
      const defaultNature =
        starterPreferences?.nature || globalScene.gameData.getSpeciesDefaultNature(species, dexEntry);
      props = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
      if (starterPreferences?.variant && !Number.isNaN(starterPreferences.variant)) {
        if (props.shiny) {
          props.variant = starterPreferences.variant as Variant;
        }
      }
      props.formIndex = starterPreferences?.form ?? props.formIndex;
      props.female = starterPreferences?.female ?? props.female;

      this.setSpeciesDetails(
        species,
        {
          shiny: props.shiny,
          formIndex: props.formIndex,
          female: props.female,
          variant: props.variant,
          abilityIndex: defaultAbilityIndex,
          natureIndex: defaultNature,
          teraType: starterPreferences?.tera,
        },
        false,
      );

      if (!isNullOrUndefined(props.formIndex)) {
        // If switching forms while the pokemon is in the team, update its moveset
        this.updateSelectedStarterMoveset(species.speciesId);
      }

      const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
      this.setTypeIcons(speciesForm.type1, speciesForm.type2);

      this.pokemonSprite.clearTint();
    } else if (this.speciesStarterDexEntry?.seenAttr) {
      this.cleanStarterSprite(species, true);

      const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));

      const formIndex = props.formIndex;
      const female = props.female;
      const shiny = props.shiny;
      const variant = props.variant;

      this.updateSprite(species, female, formIndex, shiny, variant);
      this.pokemonSprite.setVisible(true);
      this.pokemonSprite.setTint(0x808080);
    } else {
      this.cleanStarterSprite(species);

      const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));

      const formIndex = props.formIndex;
      const female = props.female;
      const shiny = props.shiny;
      const variant = props.variant;

      this.updateSprite(species, female, formIndex, shiny, variant);
      this.pokemonSprite.setVisible(true);
      this.pokemonSprite.setTint(0x000000);
    }
  }

  cleanStarterSprite(species?: PokemonSpecies, isSeen = false) {
    if (isSeen && species) {
      this.setNameAndNumber(species, {});
    } else {
      this.pokemonNumberText.setText(padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
    }

    this.pokemonSprite.setVisible(!!species);
    this.pokemonUncaughtText.setVisible(!!species);

    this.pokemonPermanentInfoContainer.setVisible(false);
    this.pokemonStatisticsContainer.setVisible(false);
    this.setNoSpeciesDetails();
  }

  setNoSpeciesDetails() {
    globalScene.ui.hideTooltip();

    this.pokemonPreferencesContainer.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.shinyOverlay.setVisible(false);
    this.pokemonNumberText
      .setColor(this.getTextColor(TextStyle.SUMMARY))
      .setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));

    for (let m = 0; m < 4; m++) {
      this.pokemonMoveContainers[m].setVisible(false);
    }
    this.pokemonEggMovesContainer.setVisible(false);
    this.pokemonAdditionalMoveCountLabel.setVisible(false);

    this.tryUpdateValue();
  }

  showStats(species: PokemonSpecies): void {
    const { dexEntry } = getSpeciesData(species.speciesId);
    this.statsContainer.setVisible(true);
    this.statsContainer.updateIvs(dexEntry.ivs);
  }

  updateSprite(
    species: PokemonSpecies,
    female: boolean,
    formIndex?: number | undefined,
    shiny?: boolean,
    variant?: Variant | undefined,
  ) {
    species.loadAssets(female, formIndex, shiny, variant, true).then(() => {
      if (this.assetLoadCancelled?.value) {
        return;
      }
      this.assetLoadCancelled = null;
      this.speciesLoaded.set(species.speciesId, true);
      // Note: Bangs are correct due to `female ??= false` above
      this.pokemonSprite
        .play(species.getSpriteKey(female!, formIndex, shiny, variant))
        .setPipelineData("shiny", shiny)
        .setPipelineData("variant", variant)
        .setPipelineData("spriteKey", species.getSpriteKey(female!, formIndex, shiny, variant))
        .setVisible(!this.statsMode);
    });
  }
}
