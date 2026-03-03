import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class LYNXSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.lynx",
    name: "LYNX",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_heal01_body_01",
      "item_equip_t4_suit_heal01_body_02",
      "item_equip_t4_suit_heal01_hand_01",
      "item_equip_t4_suit_heal01_hand_02",
      "item_equip_t4_suit_heal01_edc_01",
      "item_equip_t4_suit_heal01_edc_03",
      "item_equip_t4_suit_heal01_edc_04",
    ],
    restBonuses: [
      {
        bucket: "intellect",
        addValue: 20,
        log: "LYNX 3-piece: Treatment Effect +15%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, LYNXSetDef.setData) >=
      LYNXSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return LYNXSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (LYNXSetDef.registeredRegistries.has(registry)) return;
    LYNXSetDef.registeredRegistries.add(registry);
  }
}

export default LYNXSetDef;
