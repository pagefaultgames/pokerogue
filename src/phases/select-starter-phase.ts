import { gScene } from "#app/battle-scene";
import { applyChallenges, ChallengeType } from "#app/data/challenge";
import { Gender } from "#app/data/gender";
import { SpeciesFormChangeMoveLearnedTrigger } from "#app/data/pokemon-forms";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Species } from "#app/enums/species";
import { PlayerPokemon } from "#app/field/pokemon";
import { overrideModifiers, overrideHeldItems } from "#app/modifier/modifier";
import { Phase } from "#app/phase";
import { SaveSlotUiMode } from "#app/ui/save-slot-select-ui-handler";
import { Starter } from "#app/ui/starter-select-ui-handler";
import { Mode } from "#app/ui/ui";
import SoundFade from "phaser3-rex-plugins/plugins/soundfade";
import { TitlePhase } from "./title-phase";
import Overrides from "#app/overrides";

export class SelectStarterPhase extends Phase {

  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.playBgm("menu");

    gScene.ui.setMode(Mode.STARTER_SELECT, (starters: Starter[]) => {
      gScene.ui.clearText();
      gScene.ui.setMode(Mode.SAVE_SLOT, SaveSlotUiMode.SAVE, (slotId: integer) => {
        if (slotId === -1) {
          gScene.clearPhaseQueue();
          gScene.pushPhase(new TitlePhase());
          return this.end();
        }
        gScene.sessionSlotId = slotId;
        this.initBattle(starters);
      });
    });
  }

  /**
   * Initialize starters before starting the first battle
   * @param starters {@linkcode Pokemon} with which to start the first battle
   */
  initBattle(starters: Starter[]) {
    const party = gScene.getParty();
    const loadPokemonAssets: Promise<void>[] = [];
    starters.forEach((starter: Starter, i: integer) => {
      if (!i && Overrides.STARTER_SPECIES_OVERRIDE) {
        starter.species = getPokemonSpecies(Overrides.STARTER_SPECIES_OVERRIDE as Species);
      }
      const starterProps = gScene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
      let starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
      if (
        starter.species.speciesId in Overrides.STARTER_FORM_OVERRIDES &&
        starter.species.forms[Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!]
      ) {
        starterFormIndex = Overrides.STARTER_FORM_OVERRIDES[starter.species.speciesId]!;
      }

      let starterGender = starter.species.malePercent !== null
        ? !starterProps.female ? Gender.MALE : Gender.FEMALE
        : Gender.GENDERLESS;
      if (Overrides.GENDER_OVERRIDE !== null) {
        starterGender = Overrides.GENDER_OVERRIDE;
      }
      const starterIvs = gScene.gameData.dexData[starter.species.speciesId].ivs.slice(0);
      const starterPokemon = gScene.addPlayerPokemon(starter.species, gScene.gameMode.getStartingLevel(), starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, starterIvs, starter.nature);
      starter.moveset && starterPokemon.tryPopulateMoveset(starter.moveset);
      if (starter.passive) {
        starterPokemon.passive = true;
      }
      starterPokemon.luck = gScene.gameData.getDexAttrLuck(gScene.gameData.dexData[starter.species.speciesId].caughtAttr);
      if (starter.pokerus) {
        starterPokemon.pokerus = true;
      }

      if (starter.nickname) {
        starterPokemon.nickname = starter.nickname;
      }

      if (gScene.gameMode.isSplicedOnly || Overrides.STARTER_FUSION_OVERRIDE) {
        starterPokemon.generateFusionSpecies(true);
      }
      starterPokemon.setVisible(false);
      applyChallenges(gScene.gameMode, ChallengeType.STARTER_MODIFY, starterPokemon);
      party.push(starterPokemon);
      loadPokemonAssets.push(starterPokemon.loadAssets());
    });
    overrideModifiers();
    overrideHeldItems(party[0]);
    Promise.all(loadPokemonAssets).then(() => {
      SoundFade.fadeOut(gScene, gScene.sound.get("menu"), 500, true);
      gScene.time.delayedCall(500, () => gScene.playBgm());
      if (gScene.gameMode.isClassic) {
        gScene.gameData.gameStats.classicSessionsPlayed++;
      } else {
        gScene.gameData.gameStats.endlessSessionsPlayed++;
      }
      gScene.newBattle();
      gScene.arena.init();
      gScene.sessionPlayTime = 0;
      gScene.lastSavePlayTime = 0;
      // Ensures Keldeo (or any future Pokemon that have this type of form change) starts in the correct form
      gScene.getParty().forEach((p: PlayerPokemon) => {
        gScene.triggerPokemonFormChange(p, SpeciesFormChangeMoveLearnedTrigger);
      });
      this.end();
    });
  }
}
