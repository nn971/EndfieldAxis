import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_COMMON_SUSCEPTIBILITY_ID =
  "buff.common.susceptibility" as const;

class SusceptibilityBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_COMMON_SUSCEPTIBILITY_ID,
      name: "Susceptibility",
      icon: "BUFF_SUSCEPTIBILITY.png",
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
        const delta =
          runtime.valuePerStack !== undefined
            ? runtime.valuePerStack * stacks
            : (runtime.value ?? 0);

        if (delta === 0) return;

        collector.addValue("rcvDmgIncRatio", delta, `${this.name} (+${Math.round(delta * 100)}%)`);
      },
    });
  }
}

export default new SusceptibilityBuffDef();
