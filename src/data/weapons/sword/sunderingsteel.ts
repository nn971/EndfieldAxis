import { SimRegistry } from "../../../simulator/listeners/registry";
import { WeaponDef } from "../WeaponDef";

export const SUNDERING_STEEL_ON_STATUS_APPLY_PLUGIN_ID =
  "weapon.sunderingsteel.anthemofcinder";

class SunderingSteelDef extends WeaponDef {
  constructor() {
    super({
      id: "sunderingsteel",
      name: "Sundering Steel",
      type: "sword",
      icon: "SUNDERINGSTEEL.png",
      atkStat: {
        level1: 42,
        level90: 411,
      },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "anthemofcinder",
        cat: "combative",
        name: "Anthem of Cinder",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => (40 + 10 * r + (r > 8 ? 10 : 0)) / 1000,
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const MAX_STACKS = 2;
    const BONUS_BUFF = "weapon.sunderingsteel.atkIncRatio";

    registry.registerOnStatusApply({
      id: SUNDERING_STEEL_ON_STATUS_APPLY_PLUGIN_ID,
      when: { sourceWeaponId: this.id },
      fn: ({ sourceId }) =>
        function* (ctx) {
          yield ctx.emit.buffApply({
            sourceId,
            targetId: sourceId,
            ownerId: sourceId,
            buffId: BONUS_BUFF as any,
          });
        },
    });
  }
}

export default new SunderingSteelDef();
