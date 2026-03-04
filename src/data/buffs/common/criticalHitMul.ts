import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_CRITICAL_HIT_MUL_ID = "buff.common.criticalHitMul" as const;

class CriticalHitMulBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_CRITICAL_HIT_MUL_ID,
      name: "Critical Damage Modifier",
      icon: "BUFF_CRITICAL.png",
      durationFrames: -1,
      maxStacks: 99,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        const runtime = buff.runtime as
          | {
              value?: number;
              valuePerStack?: number;
              role?: "source" | "target";
            }
          | undefined;

        if (!runtime) return;
        if (runtime.role && runtime.role !== role) return;

        const stacks = Math.max(0, Number(buff.stacks ?? 1));
        let delta = 0;

        if (runtime.valuePerStack !== undefined) {
          delta = runtime.valuePerStack * stacks;
        } else if (runtime.value !== undefined) {
          delta = runtime.value;
        }

        if (delta !== 0) {
          collector.addValue("criticalHitMul", delta, `${this.name} (${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%)`);
        }
      },
    });
  }
}

export default new CriticalHitMulBuffDef();
