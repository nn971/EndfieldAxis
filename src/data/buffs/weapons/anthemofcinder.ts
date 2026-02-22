import { BuffDef } from "../BuffDef";
import type { SimRegistry } from "../../../simulator/listeners/registry";

class AnthemOfCinderDef extends BuffDef {
  private readonly bonusPerStack = 0.12;

  constructor() {
    super({
      id: "weapon.sunderingsteel.atkIncRatio",
      name: "Anthem Of Cinder",
      icon: "ANTHEM_OF_CINDER.png",
      durationFrames: 1200,
      maxStacks: 2,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        // stacking self buff: +8% attackIncMul per stack
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        if (!Number.isFinite(stacks) || stacks <= 0) return;
        collector.addValue(
          "atkIncRatio",
          stacks * this.bonusPerStack,
          `Anthem Of Cinder(+8% x${stacks})`,
        );
      },
    });
  }
}

export default new AnthemOfCinderDef();
