import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import BattleScene from "../battle-scene";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import Pokemon from "../field/pokemon";
import { StatsContainer } from "./stats-container";
import { TextStyle, addBBCodeTextObject, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import { getNatureName } from "../data/nature";
import * as Utils from "../utils";
import { Type } from "../data/type";

export default class PokemonInfoContainer extends Phaser.GameObjects.Container {
  private pokemonGenderLabelText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
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
    const infoBg = addWindow(this.scene, 0, 0, 104, 132);
    infoBg.setOrigin(0.5, 0.5);

    this.pokemonMovesContainer = this.scene.add.container(6, 14);

    this.movesContainerInitialX = this.pokemonMovesContainer.x;

    this.pokemonMovesContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    const movesBg = addWindow(this.scene, 0, 0, 58, 52);
    movesBg.setOrigin(1, 0);
    this.pokemonMovesContainer.add(movesBg);

    const movesLabel = addTextObject(this.scene, -movesBg.width / 2, 6, 'Moveset', TextStyle.WINDOW, { fontSize: '64px' });
    movesLabel.setOrigin(0.5, 0);
    this.pokemonMovesContainer.add(movesLabel);

    for (let m = 0; m < 4; m++) {
      const moveContainer = this.scene.add.container(-6, 18 + 7 * m);
      moveContainer.setScale(0.5);

      const moveBg = this.scene.add.nineslice(0, 0, 'type_bgs', 'unknown', 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 0, '-', TextStyle.PARTY);
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

    this.pokemonGenderLabelText = addTextObject(this.scene, -18, 20, 'Gender:', TextStyle.WINDOW, { fontSize: '64px' });
    this.pokemonGenderLabelText.setOrigin(1, 0);
    this.pokemonGenderLabelText.setVisible(false);
    this.add(this.pokemonGenderLabelText);

    this.pokemonGenderText = addTextObject(this.scene, -14, 20, '', TextStyle.WINDOW, { fontSize: '64px' });
    this.pokemonGenderText.setOrigin(0, 0);
    this.pokemonGenderText.setVisible(false);
    this.add(this.pokemonGenderText);

    this.pokemonAbilityLabelText = addTextObject(this.scene, -18, 30, 'Ability:', TextStyle.WINDOW, { fontSize: '64px' });
    this.pokemonAbilityLabelText.setOrigin(1, 0);
    this.add(this.pokemonAbilityLabelText);

    this.pokemonAbilityText = addTextObject(this.scene, -14, 30, '', TextStyle.WINDOW, { fontSize: '64px' });
    this.pokemonAbilityText.setOrigin(0, 0);
    this.add(this.pokemonAbilityText);

    this.pokemonNatureLabelText = addTextObject(this.scene, -18, 40, 'Nature:', TextStyle.WINDOW, { fontSize: '64px' });
    this.pokemonNatureLabelText.setOrigin(1, 0);
    this.add(this.pokemonNatureLabelText);

    this.pokemonNatureText = addBBCodeTextObject(this.scene, -14, 40, '', TextStyle.WINDOW, { fontSize: '64px', lineSpacing: 3, maxLines: 2 });
    this.pokemonNatureText.setOrigin(0, 0);
    this.add(this.pokemonNatureText);

    this.setVisible(false);
  }

  show(pokemon: Pokemon, showMoves: boolean = false): Promise<void> {
    return new Promise<void>(resolve => {
      if (pokemon.gender > Gender.GENDERLESS) {
        this.pokemonGenderText.setText(getGenderSymbol(pokemon.gender));
        this.pokemonGenderText.setColor(getGenderColor(pokemon.gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(pokemon.gender, true));
        this.pokemonGenderLabelText.setVisible(true);
        this.pokemonGenderText.setVisible(true);
      } else
        this.pokemonGenderText.setVisible(false);

      this.pokemonAbilityText.setText(pokemon.getAbility(true).name);
      this.pokemonNatureText.setText(getNatureName(pokemon.nature, true));

      const originalIvs: integer[] = this.scene.gameData.dexData[pokemon.species.speciesId].caughtAttr
      ? this.scene.gameData.dexData[pokemon.species.speciesId].ivs
      : null;

      this.statsContainer.updateIvs(pokemon.ivs, originalIvs);

      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(750),
        ease: 'Cubic.easeInOut',
        x: this.initialX - 104,
        onComplete: () => {
          resolve();
        }
      });

      if (showMoves) {
        this.scene.tweens.add({
          delay: Utils.fixedInt(325),
          targets: this.pokemonMovesContainer,
          duration: Utils.fixedInt(325),
          ease: 'Cubic.easeInOut',
          x: this.movesContainerInitialX - 57,
          onComplete: () => resolve()
        });
      }

      for (let m = 0; m < 4; m++) {
        const move = m < pokemon.moveset.length ? pokemon.moveset[m].getMove() : null;
        this.pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
        this.pokemonMoveLabels[m].setText(move ? move.name : '-');
        this.pokemonMovesContainers[m].setVisible(!!move);
      }

      this.setVisible(true);
      this.shown = true;
    });
  }

  hide(): Promise<void> {
    return new Promise(resolve => {
      if (!this.shown)
        return resolve();

      this.scene.tweens.add({
        targets: this.pokemonMovesContainer,
        duration: Utils.fixedInt(750),
        ease: 'Cubic.easeInOut',
        x: this.movesContainerInitialX
      });

      this.scene.tweens.add({
        targets: this,
        duration: Utils.fixedInt(750),
        ease: 'Cubic.easeInOut',
        x: this.initialX,
        onComplete: () => {
          this.setVisible(false);
          resolve();
        }
      });  

      this.shown = false;
    });
  };
}

export default interface PokemonInfoContainer {
  scene: BattleScene
}