import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class EndministratorPotential2TeamAtkShareLowDef extends BuffDef {
  constructor() {
    super({
      id: "buff.endministrator.potential2.teamAtkShare.low",
      name: "Endministrator Potential2 Team ATK Share (Low)",
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
          0.075,
          "Endministrator Potential2 ally buff(+7.5% ATK)",
        );
      },
    });
  }
}

export default new EndministratorPotential2TeamAtkShareLowDef();
