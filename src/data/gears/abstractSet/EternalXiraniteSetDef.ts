import { GearsDef, type GearsDefInit } from "../GearsDef";
import type { RestBonusEntry, OperatorBuild } from "../../../types/operator";
import type { SimRegistry } from "../../../simulator/listeners/registry";
import { GearSetBonusData } from "..";

const ETERNAL_XIRANITE_TRIGGER_BUFF_IDS = [
  "buff.common.amp",
  "buff.common.protected",
  "buff.common.susceptibility",
  "buff.common.weakened",
] as const;

const ETERNAL_XIRANITE_TEAM_DMG_BUFF_KEY =
  "set.eternalxiranite.teamDmgDealtBuff" as const;

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

    registry.registerOnBuffApply({
      id: "set.eternalxiranite.teamDmgDealtOnDebuffApply",
      match: ({ ev }) =>
        ETERNAL_XIRANITE_TRIGGER_BUFF_IDS.includes(
          ev.buffId as (typeof ETERNAL_XIRANITE_TRIGGER_BUFF_IDS)[number],
        ),
      fn: function* ({ read, ev, emit, sourceId }) {
        if (ev?.type !== "buffApply") return;
        if (!sourceId) return;

        const build = read.getBuild(sourceId);
        if (!build || !EternalXiraniteSetDef.hasRequiredPieces(build)) return;

        const teammateIds = Object.values(read.env.entitiesById)
          .filter(
            entity => entity.type === "operator" && entity.id !== sourceId,
          )
          .map(entity => entity.id);

        for (const teammateId of teammateIds) {
          yield emit.buffApply({
            sourceId,
            targetId: teammateId,
            buffId: "buff.common.dmgIncRatio",
            buffKey: ETERNAL_XIRANITE_TEAM_DMG_BUFF_KEY,
            durationFrames: 900,
            maxStacks: 1,
            runtime: {
              value: 0.16,
              role: "source",
            },
          });
        }
      },
    });
  }
}

export default EternalXiraniteSetDef;
