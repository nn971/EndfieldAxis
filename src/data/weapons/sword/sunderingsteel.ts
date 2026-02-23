import { SimRegistry } from "../../../simulator/listeners/registry";
import { WeaponDef } from "../WeaponDef";

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

    registry.registerBeforeApplyStatusForWeapon({
      weaponId: this.id,
      id: "weapon.sunderingsteel.anthemofcinder",
      fn: ({ ev, sourceId, nextSeq, makeEventId }) => {
        // Each trigger adds 1 stack by applying the buff once.
        return [
          {
            id: makeEventId(),
            type: "buffApply",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: sourceId,
            targetId: sourceId,
            buffId: BONUS_BUFF as any,
          },
        ];
      },
    });
  }
}

export default new SunderingSteelDef();
