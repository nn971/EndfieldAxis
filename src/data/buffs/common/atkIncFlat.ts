import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_ATK_INC_FLAT_ID = "buff.common.atkIncFlat" as const;

class AtkIncFlatBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_ATK_INC_FLAT_ID,
      name: "ATK Increase (Flat)",
      icon: "BUFF_ATK_UP_FLAT.png",
      durationFrames: -1,
      maxStacks: 99,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, type, collector }) => {
        const runtime = buff.runtime as
          | {
              value?: number;
              valuePerStack?: number;
              damageType?: string;
              role?: "source" | "target";
            }
          | undefined;

        if (!runtime) return;
        if (runtime.role && runtime.role !== role) return;
        if (runtime.damageType && runtime.damageType !== type) return;

        const stacks = Math.max(0, Number(buff.stacks ?? 1));
        let delta = 0;

        if (runtime.valuePerStack !== undefined) {
          delta = runtime.valuePerStack * stacks;
        } else if (runtime.value !== undefined) {
          delta = runtime.value;
        }

        if (delta !== 0) {
          collector.addValue("atkIncFlat", delta, `${this.name} (+${delta})`);
        }
      },
    });
  }
}

export default new AtkIncFlatBuffDef();
