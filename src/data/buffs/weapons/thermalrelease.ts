import { BuffDef } from "../BuffDef";
import type { SimRegistry } from "../../../simulator/listeners/registry";

class ThermalReleaseBuffDef extends BuffDef {
  constructor() {
    super({
      id: "weapon.thermitecutter.teamAtkBuff",
      name: "Flow: Thermal Release",
      icon: "THERMAL_RELEASE.png",
      durationFrames: 1200,
      maxStacks: 2,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        if (!Number.isFinite(stacks) || stacks <= 0) return;
        const bonusPerStack = Number((buff as any).meta?.bonusPerStack ?? 0.10);
        collector.addValue(
          "atkIncRatio",
          stacks * bonusPerStack,
          `Flow: Thermal Release (+${Math.round(bonusPerStack * 100)}% x${stacks})`,
        );
      },
    });
  }
}

export default new ThermalReleaseBuffDef();
