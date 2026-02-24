import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";
import type { SimEvent } from "../../../../types/simulator/simulator";

const ENDMINISTRATOR_ID = "endministrator";

function spawnCrystalConsumeEvents(params: {
  frame: number;
  targetId: string;
  nextSeq: () => number;
  makeEventId: () => string;
  ref?: string | null;
}): SimEvent[] {
  return [
    {
      id: params.makeEventId(),
      type: "buffRemove",
      frame: params.frame,
      seq: params.nextSeq(),
      sourceId: params.targetId,
      buffId: "buff.crystal" as any,
      ref: params.ref,
    },
    {
      id: params.makeEventId(),
      type: "hit",
      frame: params.frame,
      seq: params.nextSeq(),
      sourceId: ENDMINISTRATOR_ID,
      targetId: params.targetId,
      damageType: "physical",
      hitTypes: { comboSkill: true },
      dmgMultiplier: 3.2,
      ref: params.ref,
    } as SimEvent,
  ];
}

class CrystalBuffDef extends BuffDef {
  constructor() {
    super({
      id: "buff.crystal",
      name: "Crystal",
      icon: "CRYSTAL.png",
      durationFrames: 240,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector }) => {
        // crystal: increases damage suffered by +20% (incomingIncMul)
        if (role === "target") {
          collector.addValue(
            "rcvDmgIncRatio",
            0.2,
            "buff.crystal(+20% incomingInc)",
          );
        }
      },
    });

    registry.registerOnStatusApply({
      id: "buff.crystal.consume.onStatusApply",
      fn: ({ read, ev, targetId, nextSeq, makeEventId }) => {
        if (!read.env.entitiesById[ENDMINISTRATOR_ID]) return [];

        const target = read.getEntity(targetId);
        if (!(target as any).buffs?.["buff.crystal"]) return [];
        if (
          ev.statusType !== "lift" &&
          ev.statusType !== "knockDown" &&
          ev.statusType !== "crush" &&
          ev.statusType !== "breach"
        ) {
          return [];
        }

        return spawnCrystalConsumeEvents({
          frame: ev.frame,
          targetId,
          nextSeq,
          makeEventId,
          ref: ev.id,
        });
      },
    });

    registry.registerOnInflictionApply({
      id: "buff.crystal.consume.onInflictionApply",
      fn: ({ read, ev, targetId, nextSeq, makeEventId }) => {
        if (!read.env.entitiesById[ENDMINISTRATOR_ID]) return [];

        const target = read.getEntity(targetId);
        if (!(target as any).buffs?.["buff.crystal"]) return [];
        if (ev.inflictionType !== "physical") return [];

        // Skip inflictions spawned by statusApply to avoid double consume.
        if (ev.ref) {
          const parent = read.getEvent(ev.ref);
          if (parent?.type === "statusApply") return [];
        }

        return spawnCrystalConsumeEvents({
          frame: ev.frame,
          targetId,
          nextSeq,
          makeEventId,
          ref: ev.id,
        });
      },
    });
  }
}

export default new CrystalBuffDef();
