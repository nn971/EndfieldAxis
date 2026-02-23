import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimEvent } from "../../../types/simulator/simulator";
import type { SimStatusType } from "../../../types/simulator/infliction";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

const physicalStatusTypes: SimStatusType[] = [
  "lift",
  "knockDown",
  "crush",
  "breach",
];

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class SwordmancerDef extends GearsDef {
  private static simPluginRegistered = false;

  static readonly setData: GearSetBonusData = {
    id: "set.swordmancer",
    name: "Swordmancer",
    minPieces: 3,
    gearIds: [
      "swordmancerarmor",
      "swordmancerfists",
      "swordmancergauntlets",
      "swordmancerflint",
    ],
    restBonuses: [
      {
        bucket: "staggerEfficiency",
        addValue: 0.2,
        log: "Swordmancer 3-piece: Stagger Efficiency +20%",
      },
    ],
    statusProc: {
      onlyPhysicalStatus: true,
      damageType: "physical",
      dmgMultiplier: 2.5,
    },
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, SwordmancerDef.setData) >=
      SwordmancerDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return SwordmancerDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (SwordmancerDef.simPluginRegistered) return;
    SwordmancerDef.simPluginRegistered = true;

    registry.registerOnStatusApplyGlobal({
      id: "set.swordmancer.status-proc",
      fn: ctx => {
        const sourceBuild = ctx.read.getBuild(ctx.sourceId);

        if (!sourceBuild) return [];
        if (!SwordmancerDef.hasRequiredPieces(sourceBuild)) return [];

        const set = SwordmancerDef.setData;
        if (!set.statusProc) return [];

        const statusType = ctx.ev.statusType as SimStatusType;
        const isPhysicalStatus = physicalStatusTypes.includes(statusType);
        if (set.statusProc.onlyPhysicalStatus && !isPhysicalStatus) return [];

        // console.log(`triggered`);
        return [
          {
            id: ctx.makeEventId(),
            type: "hit",
            frame: ctx.ev.frame,
            seq: ctx.nextSeq(),
            sourceId: ctx.sourceId,
            targetId: ctx.targetId,
            damageType: set.statusProc.damageType,
            hitTypes: { normalSkill: true },
            dmgMultiplier: set.statusProc.dmgMultiplier,
            ref: ctx.ev.id,
          } satisfies SimEvent,
        ];
      },
    });
  }
}

export default SwordmancerDef;
