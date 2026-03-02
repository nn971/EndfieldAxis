import type { SimRegistry } from "../../../simulator/listeners/registry";
import { delay } from "../../../simulator/scripts";
import { BuffDef } from "../BuffDef";

/** Triggers Heat damage 0.8 * (1+stacksConsumed).
 *  Receive one hit 0.12 * (1+stacks) of Heat damage per second.
 *  Last for 10s.
 */

export const COMBUSTION_BUFF_ID = "buff.combustion" as const;
export const COMBUSTION_DURATION_FRAMES = 600;
export const COMBUSTION_INITIAL_HIT_BASE_MUL = 0.5;
export const COMBUSTION_INITIAL_HIT_PER_STACK_MUL = 0.35;
export const COMBUSTION_DOT_BASE_MUL = 0.2;
export const COMBUSTION_DOT_PER_STACK_MUL = 0.12;
export const COMBUSTION_DOT_INTERVAL_FRAMES = 60;

class CombustionBuffDef extends BuffDef {
  constructor() {
    super({
      id: COMBUSTION_BUFF_ID,
      name: "Combustion",
      icon: "COMBUSTION.png",
      durationFrames: COMBUSTION_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const buffId = this.id;

    registry.registerOnBuffApply({
      id: "buff.combustion.scheduleDot",
      when: { buffId },
      fn: function* ({ ev, read, emit }) {
        if (ev?.type !== "buffApply") return;
        const target = read.getEntity(ev.targetId);
        const buff = (target as any).buffs?.[buffId];
        if (!buff) return;

        const sourceId = String((buff as any).meta?.reactionSourceId ?? "");
        if (!sourceId) return;

        yield delay(COMBUSTION_DOT_INTERVAL_FRAMES);
        yield emit.reactionTick({
          sourceId,
          targetId: ev.targetId,
          reactionBuffId: buffId,
        });
      },
    });
  }
}

export default new CombustionBuffDef();
