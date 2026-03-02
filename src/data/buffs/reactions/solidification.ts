import type { SimRegistry } from "../../../simulator/listeners/registry";
import { SimEventDraft } from "../../../simulator/scripts";
import { BuffDef } from "../BuffDef";

export const SOLIDIFICATION_BUFF_ID = "buff.solidification" as const;
export const SOLIDIFICATION_BASE_DURATION_FRAMES = 360;
export const SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 90;
export const SOLIDIFICATION_INITIAL_HIT_BASE_MUL = 0.6;
export const SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.4;
export const SOLIDIFICATION_SHATTER_BASE_MUL = 2.5;
export const SOLIDIFICATION_SHATTER_PER_STACK_MUL = 1.5;

class SolidificationBuffDef extends BuffDef {
  constructor() {
    super({
      id: SOLIDIFICATION_BUFF_ID,
      name: "Solidification",
      icon: "SOLIDIFICATION.png",
      durationFrames: 360,
      maxStacks: 4,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const spawnShatter = (params: {
      frame: number;
      sourceId: string;
      targetId: string;
      stacks: number;
      ref?: string | null;
    }): SimEventDraft[] => {
      return [
        {
          type: "buffRemove" as const,
          frame: params.frame,
          ownerId: params.targetId,
          buffId: SOLIDIFICATION_BUFF_ID,
          ref: params.ref,
        },
        {
          type: "hit" as const,
          frame: params.frame,
          sourceId: params.sourceId,
          targetId: params.targetId,
          damageType: "physical",
          dmgMultiplier:
            SOLIDIFICATION_SHATTER_BASE_MUL +
            params.stacks * SOLIDIFICATION_SHATTER_PER_STACK_MUL,
          ref: params.ref,
        } as SimEventDraft,
      ];
    };

    registry.registerOnStatusApply({
      id: "buff.solidification.shatter.onPhysicalStatus",
      fn: ({ read, ev, sourceId, targetId }) => {
        if (
          ev.statusType !== "lift" &&
          ev.statusType !== "knockDown" &&
          ev.statusType !== "crush" &&
          ev.statusType !== "breach"
        ) {
          return [];
        }

        const target = read.getEntity(targetId);
        const stacks = Number(
          (target as any).buffs?.[SOLIDIFICATION_BUFF_ID]?.stacks ?? 0,
        );
        if (stacks <= 0) return [];

        return spawnShatter({
          frame: ev.frame,
          sourceId,
          targetId,
          stacks,
          ref: ev.id,
        });
      },
    });

    registry.registerOnInflictionApply({
      id: "buff.solidification.shatter.onVulnerable",
      fn: ({ read, ev, sourceId, targetId }) => {
        if (ev.inflictionType !== "vulnerable") return [];

        const target = read.getEntity(targetId);
        const stacks = Number(
          (target as any).buffs?.[SOLIDIFICATION_BUFF_ID]?.stacks ?? 0,
        );
        if (stacks <= 0) return [];

        return spawnShatter({
          frame: ev.frame,
          sourceId,
          targetId,
          stacks,
          ref: ev.id,
        });
      },
    });
  }
}

export default new SolidificationBuffDef();
