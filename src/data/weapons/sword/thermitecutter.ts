import type { SimRead } from "../../../simulator/simulator";
import { SimRegistry } from "../../../simulator/listeners/registry";
import { WeaponDef } from "../WeaponDef";

const BUFF_ID = "weapon.thermitecutter.teamAtkBuff" as const;

class ThermiteCutterDef extends WeaponDef {
  constructor() {
    super({
      id: "thermitecutter",
      name: "Thermite Cutter",
      type: "sword",
      icon: "THERMITECUTTER.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "thermalrelease",
        cat: "combative",
        name: "Flow: Thermal Release",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.22];
            return values[r] ?? 0.10;
          },
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    const applyTeamBuff = function* ({ read, emit, sourceId }: { read: SimRead; emit: any; sourceId: string }) {
      for (const entityId of Object.keys(read.env.entitiesById)) {
        const entity = read.getEntity(entityId);
        if (entity?.type === "operator") {
          yield emit.buffApply({
            sourceId,
            targetId: entityId,
            buffId: BUFF_ID,
          });
        }
      }
    };

    registry.registerOnSpRecover({
      id: "weapon.thermitecutter.onSpRecover",
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "spRecover") return;
        const sourceId = ev.sourceId;
        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;
        yield* applyTeamBuff({ read, emit, sourceId });
      },
    });

    registry.registerOnBuffApply({
      id: "weapon.thermitecutter.onLinkApplied",
      when: { buffId: "buff.link" },
      fn: function* ({ read, ev, emit, sourceId }) {
        if (ev?.type !== "buffApply") return;
        if (!sourceId) return;
        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;
        yield* applyTeamBuff({ read, emit, sourceId });
      },
    });
  }
}

export default new ThermiteCutterDef();
