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
    const BONUS_BUFF_KEY = "weapon.sunderingsteel.atkIncRatio" as const;
    const BONUS_DURATION_FRAMES = 1200;
    const MAX_STACKS = 2;
    const BONUS_PER_STACK = 0.12;

    registry.registerOnStatusApply({
      id: SUNDERING_STEEL_ON_STATUS_APPLY_PLUGIN_ID,
      when: { sourceWeaponId: this.id },
      fn: function* ({ sourceId, emit, ev }) {
        if (ev?.type !== "statusApply" || !sourceId) return;
        yield emit.buffApply({
          sourceId,
          targetId: sourceId,
          buffId: "buff.common.atkIncRatio",
          buffKey: BONUS_BUFF_KEY,
          durationFrames: BONUS_DURATION_FRAMES,
          maxStacks: MAX_STACKS,
          runtime: {
            valuePerStack: BONUS_PER_STACK,
            role: "source",
          },
        });
      },
    });
  }
}

export default new SunderingSteelDef();
