import type { SimRegistry } from "../../simulator/listeners/registry";
import { physicalHitByRank } from "../../simulator/skillOps";
import {
  ComboTriggerContext,
  OperatorDef,
  OperatorDefInit,
} from "./OperatorDef";

const NS_DMG_MUL = [
  1.69, 1.86, 2.03, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.25, 3.5, 3.8,
] as const;

const CS_DMG_MUL = [
  1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7,
] as const;

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

const ULT_SLASH_DMG_MUL = [
  0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81,
] as const;

const ULT_FINAL_DMG_MUL = [
  4.55, 5.0, 5.45, 5.91, 6.36, 6.82, 7.27, 7.73, 8.18, 8.75, 9.43, 10.23,
] as const;

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
            physicalHitByRank(26, {
              rankTable: NS_DMG_MUL,
              rankSkillType: "normalSkill",
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
            physicalHitByRank(34, {
              rankTable: CS_DMG_MUL,
              rankSkillType: "comboSkill",
              withStatus: true,
              statusType: "lift",
            }),
          ],
        },
        ultimate: {
          name: "Blade Gale",
          durationFrames: 224,
          icon: "CHENQIANYU_ULT.png",
          timeline: [
            physicalHitByRank(32, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(56, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(80, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(104, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(128, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(152, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(176, {
              rankTable: ULT_SLASH_DMG_MUL,
              rankSkillType: "ultimate",
            }),
            physicalHitByRank(205, {
              rankTable: ULT_FINAL_DMG_MUL,
              rankSkillType: "ultimate",
            }),
          ],
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const BONUS_BUFF = "buff.chenqianyu.talent1.atkInc" as const;

    registry.registerOnInflictionApply({
      id: "operator.chenqianyu.combo.triggerOnVulnerableApply",
      fn: ({ ev, nextSeq, makeEventId }) => {
        if (ev.inflictionType !== "vulnerable") return [];
        return [
          {
            id: makeEventId(),
            type: "comboTriggered",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId: this.id,
            targetId: ev.targetId,
            ref: ev.id,
          },
        ];
      },
    });

    registry.registerAfterHitForOperator({
      operatorId: this.id,
      id: "operator.chenqianyu.talent.atkStack",
      fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isSkillHit = parent
          ? parent.type === "castStart" && parent.skillType != "normalAttack"
          : false;
        if (!isSkillHit) return [];

        const talentRank = Number(
          read.getBuild(sourceId)?.talentRanks?.talent1 ?? 0,
        );
        if (talentRank <= 0) return [];

        return [
          {
            id: makeEventId(),
            type: "buffApply",
            frame: ev.frame,
            seq: nextSeq(),
            ref: ev.id,
            sourceId: sourceId,
            targetId: sourceId,
            buffId: BONUS_BUFF,
          },
        ];
      },
    });

    registry.registerGlobalDamageBonus({
      id: "operator.chenqianyu.potential3.skillDmgInc",
      fn: ({ read, ev, sourceId, collector }) => {
        if (sourceId !== this.id) return;
        if (ev?.type !== "hit") return;

        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isSkillHit = parent
          ? parent.type === "castStart" && parent.skillType != "normalAttack"
          : false;
        if (!isSkillHit) return [];

        const potentialRank = Number(
          read.getBuild(this.id)?.potentialRank ?? 0,
        );
        if (potentialRank < 3) return;

        collector.addValue(
          "dmgIncRatio",
          0.1,
          "operator.chenqianyu.potential3.skillDmgInc(+10%)",
        );
      },
    });
  }
}

export default new ChenQianyuDef();
