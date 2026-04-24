import { HeldItemEffect } from "#enums/held-item-effect";
import { Stat } from "#enums/stat";
import { HeldItemAttr } from "#items/held-item-attr";
import type { StatBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Currently used by Macho Brace item
 */
export class MachoBraceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.MACHO_BRACE> {
  public override readonly effect = HeldItemEffect.MACHO_BRACE;

  // TODO: Move to builder
  get name(): string {
    return i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.name") + " (new)";
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE.description");
  }

  public override apply({ pokemon, statHolder, stat }: StatBoostParams): void {
    const { heldItemManager: manager } = pokemon;
    const stackCount = manager.getStack(this.type);

    // Modifies the passed in stat number holder by +2 per stack for HP, +1 per stack for other stats
    // If the Macho Brace is at max stacks (50), adds additional 10% to total HP and 5% to other stats
    const isHp = stat === Stat.HP;

    statHolder.value += isHp ? 2 * stackCount : stackCount;
    if (manager.isMaxStack(this.type)) {
      statHolder.value = Math.floor(statHolder.value * (isHp ? 1.1 : 1.05));
    }
  }
}
