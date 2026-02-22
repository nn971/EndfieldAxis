import type { SimRegistry } from "../../simulator/listeners/registry";
import { physicalHit } from "../../simulator/skillOps";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

class ChenQianyuDef extends OperatorDef {
  constructor() {
    super({
      id: "chenqianyu",
      name: "Chen Qianyu",
      avatar: "CHENQIANYU.png",
      attributes: {
        main: "agility",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 10,
          agility: 20,
          intellect: 8,
          will: 9,
        },
        level90: {
          attack: 297,
          strength: 106,
          agility: 171,
          intellect: 85,
          will: 93,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Soaring Break",
          durationFrames: 300,
          icon: "CHENQIANYU_NA.png",
        },
        normalSkill: {
          name: "Ascending Strike",
          durationFrames: 50,
          icon: "CHENQIANYU_NS.png",
          timeline: [
            physicalHit(26, {
              dmgMultiplier: 2.53,
              withStatus: true,
              statusType: "lift",
            }),
          ],
        },
        comboSkill: {
          name: "Soar to the Stars",
          durationFrames: 46,
          icon: "CHENQIANYU_CS.png",
          timeline: [
            physicalHit(34, {
              dmgMultiplier: 1.8,
              withStatus: true,
              statusType: "lift",
            }),
          ],
        },
        ultimate: {
          name: "Blade Gale",
          durationFrames: 224,
          icon: "CHENQIANYU_ULT.png",
        },
      },
    } satisfies OperatorDefInit);
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const MAX_STACKS = 5;
    const BONUS_BUFF = "buff.chenqianyu.talent1.atkInc" as const;

    registry.registerAfterHitForOperator({
      operatorId: this.id,
      id: "operator.chenqianyu.talent.atkStack",
      fn: ({ ops, ev, sourceId }) => {
        // We interpret "by a skill" as: hit carries skillType, and it's not normalAttack.
        const st = (ev as any).skillType as string | undefined;
        const isSkillHit = Boolean(st && st !== "normalAttack");
        if (!isSkillHit) return;

        ops.addBuffStacks({
          targetId: sourceId,
          buffId: BONUS_BUFF,
          delta: 1,
          maxStacks: MAX_STACKS,
          logOnChange: {
            cat: "buff",
            format: (before, after) =>
              `Chen Qianyu Talent1 stacks ${before} -> ${after} (trigger=${ev.skillType})`,
          },
        });
      },
    });
  }
}

export default new ChenQianyuDef();
