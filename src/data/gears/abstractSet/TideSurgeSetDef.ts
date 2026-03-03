import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class TideSurgeSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.tidesurge",
    name: "Tide Surge",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_burst01_body_01",
      "item_equip_t4_suit_burst01_hand_01",
      "item_equip_t4_suit_burst01_edc_01",
      "item_equip_t4_suit_burst01_edc_02",
    ],
    restBonuses: [
      {
        bucket: "ultimateGainEfficiency",
        addValue: 0.15,
        log: "Tide Surge 3-piece: Ultimate Gain Efficiency +15%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, TideSurgeSetDef.setData) >=
      TideSurgeSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return TideSurgeSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (TideSurgeSetDef.registeredRegistries.has(registry)) return;
    TideSurgeSetDef.registeredRegistries.add(registry);
  }
}

export default TideSurgeSetDef;
