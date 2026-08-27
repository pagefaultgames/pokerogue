import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { ExpNotification } from "#enums/exp-notification";
import { ExpBoosterModifier } from "#modifiers/modifier";
import { PlayerPartyMemberPokemonPhase } from "#phases/player-party-member-pokemon-phase";
import { ValueHolder } from "#utils/value-holder";

export class ShowPartyExpBarPhase extends PlayerPartyMemberPokemonPhase {
  public readonly phaseName = "ShowPartyExpBarPhase";

  private readonly expValue: number;

  constructor(partyMemberIndex: number, expValue: number) {
    super(partyMemberIndex);

    this.expValue = expValue;
  }

  public override async start(): Promise<void> {
    super.start();

    const pokemon = this.getPlayerPokemon();
    const exp = new ValueHolder(this.expValue);

    globalScene.applyModifiers(ExpBoosterModifier, true, exp);
    exp.value = Math.floor(exp.value);

    const lastLevel = pokemon.level;
    pokemon.addExp(exp.value);
    const newLevel = pokemon.level;

    if (newLevel > lastLevel) {
      globalScene.phaseManager.unshiftNew("LevelUpPhase", this.partyMemberIndex, lastLevel, newLevel);
    }
    globalScene.phaseManager.unshiftNew("HidePartyExpBarPhase");
    await pokemon.updateInfo();

    switch (settings.general.partyExpNotificationMode) {
      case ExpNotification.SKIP:
        this.end();
        return;
      case ExpNotification.ONLY_LEVEL_UP:
        if (newLevel <= lastLevel) {
          this.end();
          return;
        }

        // this means if we level up
        // instead of displaying the exp gain in the small frame, we display the new level
        // we use the same method for mode 0 & 1, by giving a parameter saying to display the exp or the level
        await globalScene.partyExpBar.showPokemonExp(pokemon, exp.value, true, newLevel);
        setTimeout(() => this.end(), 800 / Math.pow(2, settings.general.expGainsSpeed));

        return;
      default:
        await globalScene.partyExpBar.showPokemonExp(pokemon, exp.value, false, newLevel);
        setTimeout(() => this.end(), 500 / Math.pow(2, settings.general.expGainsSpeed));

        return;
    }
  }
}
