import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimStatusType } from "../../../types/simulator/infliction";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

const physicalStatusTypes: SimStatusType[] = [
  "lift",
  "knockDown",
  "crush",
  "breach",
];

export const SWORDMANCER_ON_STATUS_APPLY_PLUGIN_ID =
  "set.swordmancer.status-proc";

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

    registry.registerOnStatusApply({
      id: SWORDMANCER_ON_STATUS_APPLY_PLUGIN_ID,
      fn: ctx => {
        const sourceBuild = ctx.read.getBuild(ctx.sourceId);

        if (!sourceBuild) return null;
        if (!SwordmancerDef.hasRequiredPieces(sourceBuild)) return null;

        const set = SwordmancerDef.setData;
        if (!set.statusProc) return null;

        const statusType = ctx.ev.statusType as SimStatusType;
        const isPhysicalStatus = physicalStatusTypes.includes(statusType);
        if (set.statusProc.onlyPhysicalStatus && !isPhysicalStatus) return null;

        return function* (ctx) {
          yield ctx.emit.hit({
                                    damageType: set.statusProc.damageType,
            dmgMultiplier: set.statusProc.dmgMultiplier,
            ref: ctx.ev.id,
          });
        };
      },
    });
  }
}

export default SwordmancerDef;
