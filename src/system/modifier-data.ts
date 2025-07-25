import { globalScene } from "#app/global-scene";
import { PersistentModifier } from "#modifiers/modifier";
import type { GeneratedPersistentModifierType, ModifierType } from "#modifiers/modifier-type";
import { getModifierTypeFuncById, ModifierTypeGenerator } from "#modifiers/modifier-type";

export class ModifierData {
  public player: boolean;
  public typeId: string;
  public typePregenArgs: any[];
  public args: any[];
  public stackCount: number;

  public className: string;

  constructor(source: PersistentModifier | any, player: boolean) {
    const sourceModifier = source instanceof PersistentModifier ? (source as PersistentModifier) : null;
    this.player = player;
    this.typeId = sourceModifier ? sourceModifier.type.id : source.typeId;
    if (sourceModifier) {
      if ("getPregenArgs" in source.type) {
        this.typePregenArgs = (source.type as GeneratedPersistentModifierType).getPregenArgs();
      }
    } else if (source.typePregenArgs) {
      this.typePregenArgs = source.typePregenArgs;
    }
    this.args = sourceModifier ? sourceModifier.getArgs() : source.args || [];
    this.stackCount = source.stackCount;
    this.className = sourceModifier ? sourceModifier.constructor.name : source.className;
  }

  toModifier(_constructor: any): PersistentModifier | null {
    const typeFunc = getModifierTypeFuncById(this.typeId);
    if (!typeFunc) {
      return null;
    }

    try {
      let type: ModifierType | null = typeFunc();
      type.id = this.typeId;

      if (type instanceof ModifierTypeGenerator) {
        type = (type as ModifierTypeGenerator).generateType(
          this.player ? globalScene.getPlayerParty() : globalScene.getEnemyField(),
          this.typePregenArgs,
        );
      }

      const ret = Reflect.construct(
        _constructor,
        ([type] as any[]).concat(this.args).concat(this.stackCount),
      ) as PersistentModifier;

      if (ret.stackCount > ret.getMaxStackCount()) {
        ret.stackCount = ret.getMaxStackCount();
      }

      return ret;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
