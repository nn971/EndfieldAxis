import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class Type50YinglungSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.type50yinglung",
    name: "Type 50 Yinglung",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_atk02_body_01",
      "item_equip_t4_suit_atk02_body_04",
      "item_equip_t4_suit_atk02_hand_01",
      "item_equip_t4_suit_atk02_hand_02",
      "item_equip_t4_suit_atk02_edc_01",
      "item_equip_t4_suit_atk02_edc_04",
      "item_equip_t4_suit_atk02_edc_05",
    ],
    restBonuses: [
      {
        bucket: "atkIncRatio",
        addValue: 0.12,
        log: "Type 50 Yinglung 3-piece: ATK +12%",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, Type50YinglungSetDef.setData) >=
      Type50YinglungSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return Type50YinglungSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (Type50YinglungSetDef.registeredRegistries.has(registry)) return;
    Type50YinglungSetDef.registeredRegistries.add(registry);
  }
}

export default Type50YinglungSetDef;
