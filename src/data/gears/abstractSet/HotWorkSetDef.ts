import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class HotWorkSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.hotwork",
    name: "Hot Work",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_fire_natr01_body_01",
      "item_equip_t4_suit_fire_natr01_hand_02",
      "item_equip_t4_suit_fire_natr01_hand_03",
      "item_equip_t4_suit_fire_natr01_edc_01",
      "item_equip_t4_suit_fire_natr01_edc_02",
      "item_equip_t4_suit_fire_natr01_edc_03",
    ],
    restBonuses: [
      {
        bucket: "physicalDmgIncRatio",
        addValue: 0.14,
        log: "Hot Work 3-piece: Heat/Nature DMG Dealt +14%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, HotWorkSetDef.setData) >=
      HotWorkSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return HotWorkSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (HotWorkSetDef.registeredRegistries.has(registry)) return;
    HotWorkSetDef.registeredRegistries.add(registry);
  }
}

export default HotWorkSetDef;
