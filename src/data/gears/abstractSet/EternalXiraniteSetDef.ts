import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class EternalXiraniteSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.eternalxiranite",
    name: "Eternal Xiranite",
    minPieces: 3,
    gearIds: [
      "eternalxiranitearmor",
      "item_equip_t4_suit_usp02_hand_01",
      "item_equip_t4_suit_usp02_hand_02",
      "item_equip_t4_suit_usp02_edc_01",
      "item_equip_t4_suit_usp02_edc_02",
      "item_equip_t4_suit_usp02_edc_03",
    ],
    restBonuses: [
      {
        bucket: "artsIntensity",
        addValue: 25,
        log: "Eternal Xiranite 3-piece: Arts Intensity +25",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, EternalXiraniteSetDef.setData) >=
      EternalXiraniteSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return EternalXiraniteSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (EternalXiraniteSetDef.registeredRegistries.has(registry)) return;
    EternalXiraniteSetDef.registeredRegistries.add(registry);

    registry.registerGlobalDamageBonus({
      id: "set.eternalxiranite.elementalDmgBonus",
      fn: ({ read, sourceId, type, collector }) => {
        if (!sourceId) return;

        const build = read.getBuild(sourceId);
        if (!build || !EternalXiraniteSetDef.hasRequiredPieces(build)) return;

        const elementalTypes = ["heat", "electric", "cryo", "nature"] as const;
        if (elementalTypes.includes(type as typeof elementalTypes[number])) {
          collector.addValue(
            "dmgIncRatio",
            0.15,
            "Eternal Xiranite 3-piece: Elemental DMG +15%"
          );
        }
      },
    });
  }
}

export default EternalXiraniteSetDef;
