import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class FrontiersSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.frontiers",
    name: "Frontiers",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_atb01_body_01",
      "item_equip_t4_suit_atb01_body_02",
      "item_equip_t4_suit_atb01_body_03",
      "item_equip_t4_suit_atb01_body_04",
      "item_equip_t4_suit_atb01_hand_01",
      "item_equip_t4_suit_atb01_edc_01",
      "item_equip_t4_suit_atb01_edc_02",
      "item_equip_t4_suit_atb01_edc_04",
    ],
    restBonuses: [
      {
        bucket: "physicalDmgIncRatio",
        addValue: 0.15,
        log: "Frontiers 3-piece: Physical DMG Dealt +15%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, FrontiersSetDef.setData) >=
      FrontiersSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return FrontiersSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (FrontiersSetDef.registeredRegistries.has(registry)) return;
    FrontiersSetDef.registeredRegistries.add(registry);
  }
}

export default FrontiersSetDef;
