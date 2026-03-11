import { SimRegistry } from "../../../simulator/listeners/registry";
import type { SimScriptContext } from "../../../simulator/scripts";
import { WeaponDef } from "../WeaponDef";

const BUFF_KEY = "weapon.thermitecutter.teamAtkBuff" as const;
const BUFF_DURATION_FRAMES = 1200;
const BUFF_MAX_STACKS = 2;
const BUFF_BONUS_BY_RANK = [
  0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.14,
] as const;

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
      s1: { id: "willboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "thermalrelease",
        cat: "combative",
        name: "Flow: Thermal Release",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.1, 0.12, 0.14, 0.16, 0.18, 0.2, 0.22, 0.24, 0.28];
            return values[r - 1] ?? 0.1;
          },
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    const applyTeamBuff = function* (
      ctx: Pick<SimScriptContext, "read" | "emit" | "sourceId">,
      bonusPerStack: number,
    ) {
      const { read, emit, sourceId } = ctx;
      for (const entityId of Object.keys(read.env.entitiesById)) {
        const entity = read.getEntity(entityId);
        if (entity?.type === "operator") {
          yield emit.buffApply({
            sourceId,
            targetId: entityId,
            buffId: "buff.common.atkIncRatio",
            buffKey: BUFF_KEY,
            durationFrames: BUFF_DURATION_FRAMES,
            maxStacks: BUFF_MAX_STACKS,
            runtime: {
              valuePerStack: bonusPerStack,
              role: "source",
            },
          });
        }
      }
    };

    registry.registerOnSpRecover({
      id: "weapon.thermitecutter.onSpRecover",
      fn: function* (ctx) {
        const { read, ev, emit } = ctx;
        if (ev?.type !== "spRecover") return;
        const sourceId = ev.sourceId;
        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;
        const weaponRank = build.weapon.skillRanks.s3;
        const bonusPerStack = BUFF_BONUS_BY_RANK[weaponRank - 1] ?? 0.05;
        yield* applyTeamBuff({ read, emit, sourceId }, bonusPerStack);
      },
    });

    registry.registerOnBuffApply({
      id: "weapon.thermitecutter.onLinkApplied",
      when: { buffId: "buff.link" },
      fn: function* (ctx) {
        const { read, ev, emit, sourceId } = ctx;
        if (ev?.type !== "buffApply") return;
        if (!sourceId) return;
        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;
        const weaponRank = build.weapon.skillRanks.s3;
        const bonusPerStack = BUFF_BONUS_BY_RANK[weaponRank - 1] ?? 0.05;
        yield* applyTeamBuff({ read, emit, sourceId }, bonusPerStack);
      },
    });
  }
}

export default new ThermiteCutterDef();
