import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

export const ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_P1_BUFF_ID =
  "buff.estella.combo.physicalSusceptibility.p1" as const;
export const ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_P1_DURATION_FRAMES = 540;
export const ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_RATIO = 0.1;

class EstellaComboPhysicalSusceptibilityP1Def extends BuffDef {
  constructor() {
    super({
      id: ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_P1_BUFF_ID,
      name: "Physical Susceptibility (Extended)",
      icon: "ESTELLA_CS.png",
      durationFrames: ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_P1_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector, type }) => {
        if (role !== "target") return;
        if (type !== "physical") return;
        collector.addValue(
          "rcvDmgIncRatio",
          ESTELLA_COMBO_PHYSICAL_SUSCEPTIBILITY_RATIO,
          "Physical Susceptibility(+10% physical dmg taken)",
        );
      },
    });
  }
}

export default new EstellaComboPhysicalSusceptibilityP1Def();
