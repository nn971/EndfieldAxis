import { SimRegistry } from "../../../simulator/listeners/registry";
import { WeaponDef } from "../WeaponDef";

const ATK_BUFF_ID = "weapon.objrazorhorn.atkBuff" as const;

const DMG_BONUS_BY_RANK = [
  0.08, 0.096, 0.112, 0.128, 0.144, 0.16, 0.176, 0.192, 0.224,
] as const;
const ATK_BONUS_BY_RANK = [
  0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336,
] as const;

class OBJRazorhornDef extends WeaponDef {
  constructor() {
    super({
      id: "objrazorhorn",
      name: "OBJ Razorhorn",
      type: "polearm",
      icon: "OBJRAZORHORN.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "willboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "inflictionconquestoficypeaks",
        cat: "infliction",
        name: "Conquest of Icy Peaks",
        bonus: {
          bucket: "physicalDmgIncRatio",
          byRank: r => {
            const values = [
              0.224, 0.246, 0.268, 0.291, 0.313, 0.336, 0.358, 0.381, 0.403,
            ];
            return values[r] ?? 0.224;
          },
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    registry.registerGlobalDamageBonus({
      id: "weapon.objrazorhorn.vsCryoOrSolidified",
      fn: ({ read, sourceId, targetId, collector }) => {
        if (!sourceId || !targetId) return;

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;

        const target = read.getEntity(targetId);
        if (!target) return;

        const hasCryo = ((target as any).inflictions?.cryo?.stacks ?? 0) > 0;
        const hasSolidification = Boolean(
          (target as any).buffs?.["buff.solidification"],
        );

        if (hasCryo || hasSolidification) {
          const weaponRank = build.weapon.skillRanks.s3;
          const bonusValue = DMG_BONUS_BY_RANK[weaponRank] ?? 0.08;
          collector.addValue(
            "dmgIncRatio",
            bonusValue,
            `Conquest of Icy Peaks (+${Math.round(bonusValue * 100)}% DMG vs Cryo/Solidified)`,
          );
        }
      },
    });

    registry.registerOnBuffConsumed({
      id: "weapon.objrazorhorn.onSolidificationConsumed",
      when: { buffId: "buff.solidification" },
      fn: function* ({ read, ev, emit, sourceId }) {
        if (ev?.type !== "buffRemove") return;
        if (!sourceId) return;

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== selfId) return;

        yield emit.buffApply({
          sourceId,
          targetId: sourceId,
          buffId: ATK_BUFF_ID,
        });
      },
    });
  }
}

export default new OBJRazorhornDef();
