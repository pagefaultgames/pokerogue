import { tmPoolTiers, tmSpecies } from "../data/tms";




export class MoveReminderItem {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(localeKey, iconImage, (type, args) => new Modifiers.RememberMoveModifier(type, (args[0] as PlayerPokemon).id, (args[1] as integer)),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getLearnableLevelMoves().length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, group);
  }
}

export class technicalMachine {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super("", `tm_${Type[allMoves[this.moveId].type].toLowerCase()}`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(this.moveId) === -1 || pokemon.getMoveset().filter(m => m?.moveId === moveId).length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, "tm");

    this.moveId = moveId;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TmModifierType.name", {
      moveId: Utils.padInt(Object.keys(tmSpecies).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t(scene.enableMoveInfo ? "modifierType:ModifierType.TmModifierTypeWithInfo.description" : "modifierType:ModifierType.TmModifierType.description", { moveName: allMoves[this.moveId].name });
  }
}

export const moveItems = {
	MEMORY_MUSHROOM: () => new RememberMoveModifierType("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom"),

	
}