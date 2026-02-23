import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

/** Endministrator Talent 1 (rank 2): ATK +30% for 15s when Crystal is consumed. */
class EndministratorTalent1AtkDef extends BuffDef {
  constructor() {
    super({
      id: "buff.endministrator.talent1.atkInc",
      name: "Endministrator Talent1 ATK",
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
          0.3,
          "Endministrator Talent1(+30% ATK)",
        );
      },
    });
  }
}

export default new EndministratorTalent1AtkDef();
