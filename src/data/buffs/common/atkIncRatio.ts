import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_ATK_INC_RATIO_ID = "buff.common.atkIncRatio" as const;

class AtkIncRatioBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_ATK_INC_RATIO_ID,
      name: "ATK Increase",
      icon: "BUFF_ATK_UP.png",
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
          collector.addValue("atkIncRatio", delta, `${this.name} (+${Math.round(delta * 100)}%)`);
        }
      },
    });
  }
}

export default new AtkIncRatioBuffDef();
