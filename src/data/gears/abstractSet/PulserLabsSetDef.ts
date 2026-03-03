import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}

export abstract class PulserLabsSetDef extends GearsDef {
  private static registeredRegistries = new WeakSet<SimRegistry>();

  static readonly setData: GearSetBonusData = {
    id: "set.pulserlabs",
    name: "Pulser Labs",
    minPieces: 3,
    gearIds: [
      "item_equip_t4_suit_pulse_cryst01_body_01",
      "item_equip_t4_suit_pulse_cryst01_hand_01",
      "item_equip_t4_suit_pulse_cryst01_edc_02",
    ],
    restBonuses: [
      {
        bucket: "artsIntensity",
        addValue: 30,
        log: "Pulser Labs 3-piece: Arts Intensity +30",
      },
    ],
  };

  protected constructor(init: GearsDefInit) {
    super(init);
  }

  static hasRequiredPieces(build: OperatorBuild): boolean {
    return (
      countSetPieces(build, PulserLabsSetDef.setData) >=
      PulserLabsSetDef.setData.minPieces
    );
  }

  static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[] {
    if (!this.hasRequiredPieces(build)) return [];

    return PulserLabsSetDef.setData.restBonuses.map(b => ({
      source: "gear" as const,
      bucket: b.bucket,
      addValue: b.addValue,
      log: b.log,
    }));
  }

  registerSimPlugins(registry: SimRegistry): void {
    if (PulserLabsSetDef.registeredRegistries.has(registry)) return;
    PulserLabsSetDef.registeredRegistries.add(registry);
  }
}

export default PulserLabsSetDef;
