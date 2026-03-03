import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class MISecuritySetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.misecurity",
    name: "MI Security",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_criti01_body_01",
      "item_equip_t4_suit_criti01_body_02",
      "item_equip_t4_suit_criti01_body_03",
      "item_equip_t4_suit_criti01_body_04",
      "item_equip_t4_suit_criti01_hand_01",
      "item_equip_t4_suit_criti01_hand_02",
      "item_equip_t4_suit_criti01_hand_03",
      "item_equip_t4_suit_criti01_edc_01",
      "item_equip_t4_suit_criti01_edc_02",
      "item_equip_t4_suit_criti01_edc_03",
      "item_equip_t4_suit_criti01_edc_04",
    ],
    restBonuses: [
      {
        bucket: "artsIntensity",
        addValue: 25,
        log: "MI Security 3-piece: Arts Intensity +25",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, MISecuritySetDef.setData) >=
      MISecuritySetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return MISecuritySetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (MISecuritySetDef.registeredRegistries.has(registry)) return;
    MISecuritySetDef.registeredRegistries.add(registry);
  }
}

export default MISecuritySetDef;
