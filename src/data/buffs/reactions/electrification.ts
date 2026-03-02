import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

/** Triggers Electric damage 0.8 * (1+stacksConsumed).
 *  Increases arts damage taken by 12%/16%/20%/24%.
 *  Last for 12s/18s/24s/30s.
 */

export const ELECTRIFICATION_BUFF_ID = "buff.electrification" as const;
export const ELECTRIFICATION_BASE_DURATION_FRAMES = 720;
export const ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 360;

export const ELECTRIFICATION_RCV_ARTS_BASE = 0.12;
export const ELECTRIFICATION_RCV_ARTS_PER_STACK = 0.04;

export const ELECTRIFICATION_INITIAL_HIT_BASE_MUL = 0.5;
export const ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.35;

class ElectrificationBuffDef extends BuffDef {
  constructor() {
    super({
      id: ELECTRIFICATION_BUFF_ID,
      name: "Electrification",
      icon: "ELECTRIFICATION.png",
      durationFrames: ELECTRIFICATION_BASE_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector, type, buff }) => {
        if (role !== "target") return;
        if (type === "physical") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        collector.addValue(
          "rcvDmgIncRatio",
          ELECTRIFICATION_RCV_ARTS_BASE +
            stacks * ELECTRIFICATION_RCV_ARTS_PER_STACK,
          `Electrification(+Arts dmg taken, stacks=${stacks})`,
        );
      },
    });
  }
}

export default new ElectrificationBuffDef();
