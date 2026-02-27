import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const CORROSION_BUFF_ID = "buff.corrosion" as const;
export const CORROSION_DURATION_FRAMES = 600;
export const CORROSION_INITIAL_HIT_BASE_MUL = 0.5;
export const CORROSION_INITIAL_HIT_PER_STACK_MUL = 0.35;
export const CORROSION_REDUCTION_PER_SECOND_BASE = 0.04;
export const CORROSION_REDUCTION_PER_SECOND_PER_STACK = 0.02;
export const CORROSION_MIN_RESISTANCE_BASE = -0.2;
export const CORROSION_MIN_RESISTANCE_PER_STACK = -0.08;

class CorrosionBuffDef extends BuffDef {
  constructor() {
    super({
      id: CORROSION_BUFF_ID,
      name: "Corrosion",
      icon: "CORROSION.png",
      durationFrames: CORROSION_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector, read, buff }) => {
        if (role !== "target") return;

        const elapsedFrames = Math.max(0, read.nowInFrames - buff.lastApplyFrame);
        const elapsedSeconds = elapsedFrames / 60;

        const reductionPerSecond = Number(
          (buff as any).meta?.corrosionReductionPerSecond ?? 0,
        );
        const minResistanceMul = Number(
          (buff as any).meta?.corrosionMinResistanceMul ?? 0,
        );

        const reduction = Math.min(
          elapsedSeconds * reductionPerSecond,
          Math.abs(minResistanceMul),
        );

        collector.addValue(
          "resistanceMul",
          -reduction,
          `Corrosion(res down=${reduction.toFixed(3)})`,
        );
      },
    });
  }
}

export default new CorrosionBuffDef();
