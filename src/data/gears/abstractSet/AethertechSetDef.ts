import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class AethertechSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.aethertech",
    name: "Æthertech",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_poise01_body_01",
      "item_equip_t4_suit_poise01_hand_01",
      "item_equip_t4_suit_poise01_edc_01",
      "item_equip_t4_suit_poise01_edc_02",
    ],
    restBonuses: [
      {
        bucket: "physicalDmgIncRatio",
        addValue: 0.20,
        log: "Æthertech 3-piece: DMG Bonus vs. Staggered +20%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, AethertechSetDef.setData) >=
      AethertechSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return AethertechSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (AethertechSetDef.registeredRegistries.has(registry)) return;
    AethertechSetDef.registeredRegistries.add(registry);
  }
}

export default AethertechSetDef;
