import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  1.69, 1.86, 2.03, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.25, 3.5, 3.8,
] as const;

const CS_DMG_MUL = [
  1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7,
] as const;

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

const CS_COOLDOWN_SECONDS_P5 = [
  13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12,
] as const;

const ULT_SLASH_DMG_MUL = [
  0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81,
] as const;

const ULT_FINAL_DMG_MUL = [
  4.55, 5.0, 5.45, 5.91, 6.36, 6.82, 7.27, 7.73, 8.18, 8.75, 9.43, 10.23,
] as const;
const NA_HIT1_DMG_MUL = new Array(12).fill(0.5) as readonly number[];
const NA_HIT2_DMG_MUL = new Array(12).fill(0.6) as readonly number[];
const NA_HIT3_DMG_MUL = new Array(12).fill(0.7) as readonly number[];
const NA_HIT4_DMG_MUL = new Array(12).fill(0.8) as readonly number[];
const NA_HIT5_DMG_MUL = new Array(12).fill(0.9) as readonly number[];

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
          staggerOnHit: 16,
          script: function* (ctx) {
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT5_DMG_MUL[r] ?? 0),
              staggerOnHit: 16,
            });
          },
        },
        normalSkill: {
          name: "Ascending Strike",
          durationFrames: 50,
          icon: "CHENQIANYU_NS.png",
          script: function* (ctx) {
            yield delay(26);
            yield ctx.emit.statusApply({
              statusType: "lift",
            });
            const potentialRank = Number(
              ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0,
            );
            const baseMultiplier = ctx.byRank!(r => NS_DMG_MUL[r] ?? 0);
            const finalMultiplier =
              potentialRank >= 3 ? baseMultiplier * 1.1 : baseMultiplier;
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: finalMultiplier,
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Soar to the Stars",
          durationFrames: 46,
          icon: "CHENQIANYU_CS.png",
          script: function* (ctx) {
            yield delay(34);
            yield ctx.emit.statusApply({
              statusType: "lift",
            });
            const potentialRank = Number(
              ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0,
            );
            const baseMultiplier = ctx.byRank!(r => CS_DMG_MUL[r] ?? 0);
            const finalMultiplier =
              potentialRank >= 3 ? baseMultiplier * 1.1 : baseMultiplier;
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: finalMultiplier,
            });
          },
        },
        ultimate: {
          name: "Blade Gale",
          durationFrames: 224,
          icon: "CHENQIANYU_ULT.png",
          script: function* (ctx) {
            const potentialRank = Number(
              ctx.read.getBuild(ctx.sourceId!)?.potentialRank ?? 0,
            );
            const slashMultiplierBase = ctx.byRank!(r => ULT_SLASH_DMG_MUL[r] ?? 0);
            const slashMultiplier =
              potentialRank >= 3 ? slashMultiplierBase * 1.1 : slashMultiplierBase;
            const finalMultiplierBase = ctx.byRank!(r => ULT_FINAL_DMG_MUL[r] ?? 0);
            const finalMultiplier =
              potentialRank >= 3 ? finalMultiplierBase * 1.1 : finalMultiplierBase;
            yield delay(32);
            for (let i = 0; i < 7; i += 1) {
              yield ctx.emit.hit({
                damageType: "physical",
                dmgMultiplier: slashMultiplier,
                staggerOnHit: i === 0 ? 15 : 0,
              });
              if (i < 6) {
                yield delay(24);
              }
            }
            yield delay(29);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: finalMultiplier,
              staggerOnHit: 20,
            });
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(potentialRank?: number): readonly number[] | null {
    if (potentialRank && potentialRank >= 5) {
      return CS_COOLDOWN_SECONDS_P5;
    }
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(potentialRank?: number): number {
    const baseCost = 100;
    if (potentialRank && potentialRank >= 4) {
      return Math.floor(baseCost * 0.85);
    }
    return baseCost;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 6;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const BONUS_BUFF_KEY = "buff.chenqianyu.talent1.atkInc" as const;
    const BONUS_DURATION_FRAMES = 600;
    const BONUS_MAX_STACKS = 5;
    const selfId = this.id;

    registry.registerOnInflictionApply({
      id: "operator.chenqianyu.combo.triggerOnVulnerableApply",
      fn: function* ({ ev, emit }) {
        if (
          ev?.type !== "inflictionApply" ||
          ev.inflictionType !== "vulnerable"
        ) {
          return;
        }

        yield emit.comboTriggered({
          sourceId: selfId,
          targetId: ev.targetId,
        });
      },
    });

    registry.registerAfterHit({
      id: "operator.chenqianyu.talent.atkStack",
      when: { sourceOperatorId: selfId },
      fn: function* ({ read, ev, sourceId, emit }) {
        if (ev?.type !== "hit" || !sourceId) return;
        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isSkillHit = parent
          ? parent.type === "castStart" && parent.skillType !== "normalAttack"
          : false;
        if (!isSkillHit) return;

        const talentRank = Number(
          read.getBuild(sourceId)?.talentRanks?.talent1 ?? 0,
        );
        if (talentRank <= 0) return;

        const bonusPerStack = talentRank >= 2 ? 0.08 : 0.04;

        yield emit.buffApply({
          sourceId,
          targetId: sourceId,
          buffId: "buff.common.atkIncRatio",
          buffKey: BONUS_BUFF_KEY,
          durationFrames: BONUS_DURATION_FRAMES,
          maxStacks: BONUS_MAX_STACKS,
          runtime: {
            valuePerStack: bonusPerStack,
            role: "source",
          },
        });
      },
    });

    registry.registerGlobalDamageBonus({
      id: "operator.chenqianyu.potential2.physicalDmgInc",
      fn: ({ read, sourceId, collector }) => {
        if (sourceId !== selfId) return;

        const potentialRank = Number(read.getBuild(selfId)?.potentialRank ?? 0);
        if (potentialRank < 2) return;

        collector.addValue(
          "dmgIncRatio",
          0.08,
          "operator.chenqianyu.potential2.physicalDmgInc(+8%)",
        );
      },
    });

    registry.registerGlobalDamageBonus({
      id: "operator.chenqianyu.potential3.skillDmgInc",
      fn: ({ read, ev, sourceId, collector }) => {
        if (sourceId !== selfId) return;
        if (ev?.type !== "hit") return;

        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isSkillHit = parent
          ? parent.type === "castStart" && parent.skillType !== "normalAttack"
          : false;
        if (!isSkillHit) return;

        const potentialRank = Number(read.getBuild(selfId)?.potentialRank ?? 0);
        if (potentialRank < 3) return;

        collector.addValue(
          "dmgIncRatio",
          0.1,
          "operator.chenqianyu.potential3.skillDmgInc(+10%)",
        );
      },
    });

    registry.registerGlobalDamageBonus({
      id: "operator.chenqianyu.potential1.lowHpDmgInc",
      fn: ({ read, sourceId, targetId, collector }) => {
        if (sourceId !== selfId) return;

        const potentialRank = Number(read.getBuild(selfId)?.potentialRank ?? 0);
        if (potentialRank < 1) return;

        const target = read.getEntity(targetId);
        if (!target) return;

        const targetHpPercent = (target as any).hp / ((target as any).maxHp ?? 1);
        if (targetHpPercent >= 0.5) return;

        collector.addValue(
          "dmgIncRatio",
          0.2,
          "operator.chenqianyu.potential1.lowHpDmgInc(+20%)",
        );
      },
    });
  }
}

export default new ChenQianyuDef();
