import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

/** Potential 2: allies gain half of Endministrator Talent1 ATK buff. */
class EndministratorPotential2TeamAtkShareHighDef extends BuffDef {
  constructor() {
    super({
      id: "buff.endministrator.potential2.teamAtkShare.high",
      name: "Endministrator Potential2 Team ATK Share (High)",
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
          "Endministrator Potential2 ally buff(+15% ATK)",
        );
      },
    });
  }
}

export default new EndministratorPotential2TeamAtkShareHighDef();
