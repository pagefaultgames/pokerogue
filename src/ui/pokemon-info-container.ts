import { getVariantTint } from "#app/data/variant";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import BattleScene from "../battle-scene";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { getNatureName } from "../data/nature";
import { Type } from "../data/type";
import Pokemon from "../field/pokemon";
import i18next from "../plugins/i18n";
import * as Utils from "../utils";
import ConfirmUiHandler from "./confirm-ui-handler";
import { StatsContainer } from "./stats-container";
import { TextStyle, addBBCodeTextObject, addTextObject, getTextColor } from "./text";
import { addWindow } from "./ui-theme";
import { DexAttr } from "../system/game-data";

interface LanguageSetting {
  infoContainerTextSize: string;
  infoContainerLabelXPos?: integer;
  infoContainerTextXPos?: integer;
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "en": {
    infoContainerTextSize: "64px"
  },
  "de": {
    infoContainerTextSize: "64px"
  },
  "es": {
    infoContainerTextSize: "64px"
  },
  "fr": {
    infoContainerTextSize: "64px"
  },
  "it": {
    infoContainerTextSize: "64px"
  },
  "zh": {
    infoContainerTextSize: "64px"
  },
  "pt": {
    infoContainerTextSize: "60px",
    infoContainerLabelXPos: -16,
    infoContainerTextXPos: -12,
  },
};

export default class PokemonInfoContainer extends Phaser.GameObjects.Container {
  private readonly infoWindowWidth = 104;

  private pokemonFormLabelText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonGenderNewText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
  private pokemonShinyIcon: Phaser.GameObjects.Image;
  private pokemonShinyNewIcon: Phaser.GameObjects.Image;
  private pokemonFusionShinyIcon: Phaser.GameObjects.Image;
  private pokemonMovesContainer: Phaser.GameObjects.Container;
  private pokemonMovesContainers: Phaser.GameObjects.Container[];
  private pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonMoveLabels: Phaser.GameObjects.Text[];

  private initialX: number;
  private movesContainerInitialX: number;

  public statsContainer: StatsContainer;

  public shown: boolean;

  constructor(scene: BattleScene, x: number = 372, y: number = 66) {
    super(scene, x, y);
    this.initialX = x;
  }

  setup(): void {
    const currentLanguage = i18next.language;
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang));
    const textSettings = languageSettings[langSettingKey];
    const infoBg = addWindow(this.scene, 0, 0, this.infoWindowWidth, 132);
    infoBg.setOrigin(0.5, 0.5);

    this.pokemonMovesContainer = this.scene.add.container(6, 14);

    this.movesContainerInitialX = this.pokemonMovesContainer.x;

    this.pokemonMovesContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    const movesBg = addWindow(this.scene, 0, 0, 58, 52);
    movesBg.setOrigin(1, 0);
    this.pokemonMovesContainer.add(movesBg);

    const movesLabel = addTextObject(this.scene, -movesBg.width / 2, 6, i18next.t("pokemonInfoContainer:moveset"), TextStyle.WINDOW, { fontSize: "64px" });
    movesLabel.setOrigin(0.5, 0);
    this.pokemonMovesContainer.add(movesLabel);

    for (let m = 0; m < 4; m++) {
      const moveContainer = this.scene.add.container(-6, 18 + 7 * m);
      moveContainer.setScale(0.5);

      const moveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 0, "-", TextStyle.PARTY);
      moveLabel.setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add(moveBg);
      moveContainer.add(moveLabel);

      this.pokemonMovesContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.add(this.pokemonMovesContainer);

    this.statsContainer = new StatsContainer(this.scene, -48, -64, true);

    this.add(infoBg);
    this.add(this.statsContainer);

    // The position should be set per language
    const infoContainerLabelXPos = textSettings?.infoContainerLabelXPos || -18;
    const infoContainerTextXPos = textSettings?.infoContainerTextXPos || -14;

    // The font size should be set by language
    const infoContainerTextSize = textSettings?.infoContainerTextSize || "64px";

    this.pokemonFormLabelText = addTextObject(this.scene, infoContainerLabelXPos, 18, "", TextStyle.WINDOW, { fontSize: infoContainerTextSize });
    this.pokemonFormLabelText.setOrigin(0, 0);
    this.pokemonFormLabelText.setVisible(false);
    this.add(this.pokemonFormLabelText);

    this.pokemonGenderText = addTextObject(this.scene, -42, -61, "", TextStyle.WINDOW, { fontSize: infoContainerTextSize });
    this.pokemonGenderText.setOrigin(0, 0);
    this.add(this.pokemonGenderText);

    this.pokemonGenderNewText = addTextObject(this.scene, -36, -61, "", TextStyle.WINDOW, { fontSize: "64px" });
    this.pokemonGenderNewText.setOrigin(0, 0);
    this.pokemonGenderNewText.setVisible(false);
    this.add(this.pokemonGenderNewText);

    this.pokemonAbilityLabelText = addTextObject(this.scene, infoContainerLabelXPos, 28, i18next.t("pokemonInfoContainer:ability"), TextStyle.WINDOW, { fontSize: infoContainerTextSize });
    this.pokemonAbilityLabelText.setOrigin(1, 0);
    this.add(this.pokemonAbilityLabelText);

    this.pokemonAbilityText = addTextObject(this.scene, infoContainerTextXPos, 28, "", TextStyle.WINDOW, { fontSize: infoContainerTextSize });
    this.pokemonAbilityText.setOrigin(0, 0);
    this.add(this.pokemonAbilityText);

    this.pokemonNatureLabelText = addTextObject(this.scene, infoContainerLabelXPos, 38, i18next.t("pokemonInfoContainer:nature"), TextStyle.WINDOW, { fontSize: infoContainerTextSize });
    this.pokemonNatureLabelText.setOrigin(1, 0);
    this.add(this.pokemonNatureLabelText);

    this.pokemonNatureText = addBBCodeTextObject(this.scene, infoContainerTextXPos, 38, "", TextStyle.WINDOW, { fontSize: infoContainerTextSize, lineSpacing: 3, maxLines: 2 });
    this.pokemonNatureText.setOrigin(0, 0);
    this.add(this.pokemonNatureText);

    this.pokemonShinyIcon = this.scene.add.image(-43.5, 48.5, "shiny_star");
    this.pokemonShinyIcon.setOrigin(0, 0);
    this.pokemonShinyIcon.setScale(0.75);
    this.pokemonShinyIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.add(this.pokemonShinyIcon);

    this.pokemonShinyNewIcon = addTextObject(this.scene, this.pokemonShinyIcon.x + 12, this.pokemonShinyIcon.y, "", TextStyle.WINDOW, { fontSize: "64px" });
    this.pokemonShinyNewIcon.setOrigin(0, 0);
    this.add(this.pokemonShinyNewIcon);
    this.pokemonShinyNewIcon.setVisible(false);

    this.pokemonFusionShinyIcon = this.scene.add.image(this.pokemonShinyIcon.x, this.pokemonShinyIcon.y, "shiny_star_2");
    this.pokemonFusionShinyIcon.setOrigin(0, 0);
    this.pokemonFusionShinyIcon.setScale(0.75);
    this.add(this.pokemonFusionShinyIcon);

    this.setVisible(false);
  }

  show(pokemon: Pokemon, showMoves: boolean = false, speedMultiplier: number = 1): Promise<void> {
    return new Promise<void>(resolve => {
      const caughtAttr = BigInt(pokemon.scene.gameData.dexData[pokemon.species.speciesId].caughtAttr);
      if (pokemon.gender > Gender.GENDERLESS) {
        this.pokemonGenderText.setText(getGenderSymbol(pokemon.gender));
        this.pokemonGenderText.setColor(getGenderColor(pokemon.gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(pokemon.gender, true));
        this.pokemonGenderText.setVisible(true);

        const newGender = BigInt(Math.pow(2, pokemon.gender + 2)); // adding 2 here because of the 2 starting bits being related to shiny, not gender
        this.pokemonGenderNewText.setText("(+)");
        this.pokemonGenderNewText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        this.pokemonGenderNewText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        this.pokemonGenderNewText.setVisible((newGender & caughtAttr) === BigInt(0));
      } else {
        this.pokemonGenderText.setVisible(false);
      }

      if (pokemon.species.forms?.[pokemon.formIndex]?.formName !== undefined) {
        this.pokemonFormLabelText.setVisible(true);
        const newForm = BigInt(Math.pow(2, pokemon.formIndex)) * DexAttr.DEFAULT_FORM;
        if ((newForm & caughtAttr) === BigInt(0)) {
          this.pokemonFormLabelText.setText(i18next.t("pokemonInfoContainer:newForm"));
          this.pokemonFormLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
          this.pokemonFormLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        } else {
          this.pokemonFormLabelText.setText(i18next.t("pokemonInfoContainer:existingForm"));
          this.pokemonFormLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
          this.pokemonFormLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
        }
        this.pokemonFormLabelText.x = (this.pokemonFormLabelText.getLeftCenter().x - this.pokemonFormLabelText.getRightCenter().x) / 2; // using this to center the pokemonFormLabelText horizontally as the text is dynamic and can change
        this.pokemonFormLabelText.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.pokemonFormLabelText.width, this.pokemonFormLabelText.height), Phaser.Geom.Rectangle.Contains);
        this.pokemonFormLabelText.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip(null, pokemon.species.forms?.[pokemon.formIndex]?.formName, true));
        this.pokemonFormLabelText.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
      }

      const abilityTextStyle = pokemon.abilityIndex === (pokemon.species.ability2 ? 2 : 1) ? TextStyle.MONEY : TextStyle.WINDOW;
      this.pokemonAbilityText.setText(pokemon.getAbility(true).name);
      this.pokemonAbilityText.setColor(getTextColor(abilityTextStyle, false, this.scene.uiTheme));
      this.pokemonAbilityText.setShadowColor(getTextColor(abilityTextStyle, true, this.scene.uiTheme));

      /**
       * If the opposing Pokemon only has 1 normal ability and is using the hidden ability it should have the same behavior
       * if it had 2 normal abilities. This code checks if that is the case and uses the correct opponent Pokemon abilityIndex (2)
       * for calculations so it aligns with where the hidden ability is stored in the starter data's abilityAttr (4)
       */
      const opponentPokemonOneNormalAbility = (pokemon.species.getAbilityCount() === 2);
      const opponentPokemonAbilityIndex = (opponentPokemonOneNormalAbility && pokemon.abilityIndex === 1) ? 2 : pokemon.abilityIndex;
      const opponentPokemonAbilityAttr = Math.pow(2, opponentPokemonAbilityIndex);

      const rootFormHasHiddenAbility = pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].abilityAttr & opponentPokemonAbilityAttr;

      if (!rootFormHasHiddenAbility) {
        this.pokemonAbilityLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        this.pokemonAbilityLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
      } else {
        this.pokemonAbilityLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
        this.pokemonAbilityLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
      }

      this.pokemonNatureText.setText(getNatureName(pokemon.getNature(), true, false, false, this.scene.uiTheme));

      const dexNatures = pokemon.scene.gameData.dexData[pokemon.species.speciesId].natureAttr;
      const newNature = Math.pow(2, pokemon.nature + 1);

      if (!(dexNatures & newNature)) {
        this.pokemonNatureLabelText.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        this.pokemonNatureLabelText.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
      } else {
        this.pokemonNatureLabelText.setColor(getTextColor(TextStyle.WINDOW, false, this.scene.uiTheme));
        this.pokemonNatureLabelText.setShadowColor(getTextColor(TextStyle.WINDOW, true, this.scene.uiTheme));
      }

      const isFusion = pokemon.isFusion();
      const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
      const baseVariant = !doubleShiny ? pokemon.getVariant() : pokemon.variant;

      this.pokemonShinyIcon.setTexture(`shiny_star${doubleShiny ? "_1" : ""}`);
      this.pokemonShinyIcon.setVisible(pokemon.isShiny());
      this.pokemonShinyIcon.setTint(getVariantTint(baseVariant));
      if (this.pokemonShinyIcon.visible) {
        const shinyDescriptor = doubleShiny || baseVariant ?
          `${baseVariant === 2 ? i18next.t("pokemonInfoContainer:epic") : baseVariant === 1 ? i18next.t("pokemonInfoContainer:rare") : i18next.t("pokemonInfoContainer:common")}${doubleShiny ? `/${pokemon.fusionVariant === 2 ? i18next.t("pokemonInfoContainer:epic") : pokemon.fusionVariant === 1 ? i18next.t("pokemonInfoContainer:rare") : i18next.t("pokemonInfoContainer:common")}` : ""}`
          : "";
        this.pokemonShinyIcon.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip(null, `Shiny${shinyDescriptor ? ` (${shinyDescriptor})` : ""}`, true));
        this.pokemonShinyIcon.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());

        const newShiny = BigInt(Math.pow(2, pokemon.shiny));
        const newVariant = BigInt(Math.pow(2, pokemon.variant + 4));

        this.pokemonShinyNewIcon.setText("(+)");
        this.pokemonShinyNewIcon.setColor(getTextColor(TextStyle.SUMMARY_BLUE, false, this.scene.uiTheme));
        this.pokemonShinyNewIcon.setShadowColor(getTextColor(TextStyle.SUMMARY_BLUE, true, this.scene.uiTheme));
        const newShinyOrVariant = ((newShiny & caughtAttr) === BigInt(0)) || ((newVariant & caughtAttr) === BigInt(0));
        this.pokemonShinyNewIcon.setVisible(!!newShinyOrVariant);
      }

      this.pokemonFusionShinyIcon.setPosition(this.pokemonShinyIcon.x, this.pokemonShinyIcon.y);
      this.pokemonFusionShinyIcon.setVisible(doubleShiny);
      if (isFusion) {
        this.pokemonFusionShinyIcon.setTint(getVariantTint(pokemon.fusionVariant));
      }

      const starterSpeciesId = pokemon.species.getRootSpeciesId();
      const originalIvs: integer[] = this.scene.gameData.dexData[starterSpeciesId].caughtAttr
        ? this.scene.gameData.dexData[starterSpeciesId].ivs
        : null;

      this.statsContainer.updateIvs(pokemon.ivs, originalIvs);

      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(Math.floor(750 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: this.initialX - this.infoWindowWidth,
        onComplete: () => {
          resolve();
        }
      });

      if (showMoves) {
        this.scene.tweens.add({
          delay: Utils.fixedInt(Math.floor(325 / speedMultiplier)),
          targets: this.pokemonMovesContainer,
          duration: Utils.fixedInt(Math.floor(325 / speedMultiplier)),
          ease: "Cubic.easeInOut",
          x: this.movesContainerInitialX - 57,
          onComplete: () => resolve()
        });
      }

      for (let m = 0; m < 4; m++) {
        const move = m < pokemon.moveset.length ? pokemon.moveset[m].getMove() : null;
        this.pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
        this.pokemonMoveLabels[m].setText(move ? move.name : "-");
        this.pokemonMovesContainers[m].setVisible(!!move);
      }

      this.setVisible(true);
      this.shown = true;
    });
  }

  makeRoomForConfirmUi(speedMultiplier: number = 1): Promise<void> {
    return new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(Math.floor(150 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: this.initialX - this.infoWindowWidth - ConfirmUiHandler.windowWidth,
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  hide(speedMultiplier: number = 1): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown) {
        return resolve();
      }

      this.scene.tweens.add({
        targets: this.pokemonMovesContainer,
        duration: Utils.fixedInt(Math.floor(750 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: this.movesContainerInitialX
      });

      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(Math.floor(750 / speedMultiplier)),
        ease: "Cubic.easeInOut",
        x: this.initialX,
        onComplete: () => {
          this.setVisible(false);
          this.pokemonShinyIcon.off("pointerover");
          this.pokemonShinyIcon.off("pointerout");
          (this.scene as BattleScene).ui.hideTooltip();
          resolve();
        }
      });

      this.shown = false;
    });
  }
}

export default interface PokemonInfoContainer {
  scene: BattleScene
}
