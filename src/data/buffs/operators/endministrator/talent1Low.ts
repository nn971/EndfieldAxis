import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

/** Endministrator Talent 1 (rank 1): ATK +15% for 15s when Crystal is consumed. */
class EndministratorTalent1AtkLowDef extends BuffDef {
  constructor() {
    super({
      id: "buff.endministrator.talent1.atkInc.low",
      name: "Endministrator Talent1 ATK (Low)",
      icon: "ENDMINISTRATOR.png",
      durationFrames: 900,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector }) => {
        if (role !== "source") return;
        collector.addValue(
          "atkIncRatio",
          0.15,
          "Endministrator Talent1(+15% ATK)",
        );
      },
    });
  }
}

export default new EndministratorTalent1AtkLowDef();
