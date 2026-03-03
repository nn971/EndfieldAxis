import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class BonekrushaSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.bonekrusha",
    name: "Bonekrusha",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_attri01_body_01",
      "item_equip_t4_suit_attri01_body_02",
      "item_equip_t4_suit_attri01_body_03",
      "item_equip_t4_suit_attri01_body_04",
      "item_equip_t4_suit_attri01_edc_03",
      "item_equip_t4_suit_attri01_edc_04",
      "item_equip_t4_suit_attri01_edc_05",
      "item_equip_t4_suit_attri01_edc_06",
    ],
    restBonuses: [
      {
        bucket: "physicalDmgIncRatio",
        addValue: 0.18,
        log: "Bonekrusha 3-piece: Physical DMG Dealt +18%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, BonekrushaSetDef.setData) >=
      BonekrushaSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return BonekrushaSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (BonekrushaSetDef.registeredRegistries.has(registry)) return;
    BonekrushaSetDef.registeredRegistries.add(registry);
  }
}

export default BonekrushaSetDef;
