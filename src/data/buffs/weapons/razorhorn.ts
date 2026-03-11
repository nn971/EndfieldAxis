import { BuffDef } from "../BuffDef";
import type { SimRegistry } from "../../../simulator/listeners/registry";

class RazorhornAtkBuffDef extends BuffDef {
  constructor() {
    super({
      id: "weapon.objrazorhorn.atkBuff",
      name: "Conquest of Icy Peaks",
      icon: "CONQUEST_OF_ICY_PEAKS.png",
      durationFrames: 900,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        if (role !== "source") return;
        const bonusValue = Number((buff as any).meta?.atkBonus ?? 0.12);
        collector.addValue(
          "atkIncRatio",
          bonusValue,
          `Conquest of Icy Peaks (+${Math.round(bonusValue * 1000) / 10}% ATK)`,
        );
      },
    });
  }
}

export default new RazorhornAtkBuffDef();
