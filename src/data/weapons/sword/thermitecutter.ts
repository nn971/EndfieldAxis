import { SimRegistry } from "../../../simulator/listeners/registry";
import type { SimScriptContext } from "../../../simulator/scripts";
import { WeaponDef } from "../WeaponDef";

const BUFF_KEY = "weapon.thermitecutter.teamAtkBuff" as const;
const BUFF_DURATION_FRAMES = 1200;
const BUFF_MAX_STACKS = 1;
const BUFF_BONUS_PER_STACK = 0.05;

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
            const values = [
              0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2,
              0.22,
            ];
            return values[r] ?? 0.1;
          },
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    const applyTeamBuff = function* (
      ctx: Pick<SimScriptContext, "read" | "emit" | "sourceId">,
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
              valuePerStack: BUFF_BONUS_PER_STACK,
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
        yield* applyTeamBuff({ read, emit, sourceId });
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
        yield* applyTeamBuff({ read, emit, sourceId });
      },
    });
  }
}

export default new ThermiteCutterDef();
