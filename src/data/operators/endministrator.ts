import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorBuild } from "../../types/operator";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3.0, 3.23, 3.5,
] as const;

const CS_DMG_MUL = [
  0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1.0,
] as const;

const ULT_DMG_MUL = [
  3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8.0,
] as const;

const ULT_BONUS_DMG_MUL = [
  2.67, 2.94, 3.2, 3.47, 3.74, 4.0, 4.27, 4.54, 4.8, 5.14, 5.54, 6.0,
] as const;
const NA_HIT1_DMG_MUL = new Array(12).fill(0.5) as readonly number[];
const NA_HIT2_DMG_MUL = new Array(12).fill(0.6) as readonly number[];
const NA_HIT3_DMG_MUL = new Array(12).fill(0.7) as readonly number[];
const NA_HIT4_DMG_MUL = new Array(12).fill(0.8) as readonly number[];
const NA_HIT5_DMG_MUL = new Array(12).fill(0.9) as readonly number[];

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

class EndministratorDef extends OperatorDef {
  constructor() {
    super({
      id: "endministrator",
      name: "Endministrator",
      avatar: "ENDMINISTRATOR.png",
      attributes: {
        main: "agility",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 14,
          agility: 14,
          intellect: 9,
          will: 10,
        },
        level90: {
          attack: 319,
          strength: 123,
          agility: 140,
          intellect: 96,
          will: 107,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Destructive Sequence",
          durationFrames: 300,
          icon: "ENDMINISTRATOR_NA.png",
          staggerOnHit: 18,
          script: function* (ctx) {
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT1_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT2_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT3_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT4_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT5_DMG_MUL),
              staggerOnHit: 18,
            });
          },
        },
        normalSkill: {
          name: "Constructive Sequence",
          durationFrames: 48,
          icon: "ENDMINISTRATOR_NS.png",
          script: function* (ctx) {
            yield delay(24);
            yield ctx.emit.statusApply({
              statusType: "crush",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Sealing Sequence",
          durationFrames: 46,
          icon: "ENDMINISTRATOR_CS.png",
          script: function* (ctx) {
            yield delay(45);
            yield ctx.emit.buffApply({
              buffId: "buff.crystal",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, CS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Bombardment Sequence",
          durationFrames: 110,
          icon: "ENDMINISTRATOR_ULT.png",
          script: function* (ctx) {
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_DMG_MUL),
              staggerOnHit: 25,
            });
            yield delay(1);
            // TODO this hit should triggered only if consumes Crystal
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_BONUS_DMG_MUL),
            });
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 110;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    registry.registerAfterHit({
      id: "operator.endministrator.combo.triggerOnAllyComboHit",
      fn: function* ({ read, ev, sourceId, emit }) {
        if (ev?.type !== "hit" || !sourceId || sourceId === selfId) return;
        const source = read.getEntity(sourceId);
        if (!source || source.type !== "operator") return;

        const parent = ev.ref ? read.getEvent(ev.ref) : null;
        const isComboHit =
          parent?.type === "castStart" && parent.skillType === "comboSkill";
        if (!isComboHit) return;

        yield emit.comboTriggered({
          sourceId: selfId,
          targetId: ev.targetId,
        });
      },
    });

    registry.registerOnBuffConsumed({
      id: "operator.endministrator.talent1.onCrystalConsumed",
      when: { buffId: "buff.crystal" },
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "buffRemove" || !read.env.entitiesById[selfId]) return;
        const build = read.getBuild(selfId) as OperatorBuild;
        const talentRank = Number(build?.talentRanks?.talent1 ?? 0);
        if (talentRank <= 0) return;
        if (ev.ref === undefined || ev.ref === null) return;

        const buffId =
          talentRank >= 2
            ? "buff.endministrator.talent1.atkInc"
            : "buff.endministrator.talent1.atkInc.low";

        yield emit.buffApply({
          sourceId: selfId,
          targetId: selfId,
          buffId: buffId,
        });

        if (build.potentialRank >= 1) {
          const consumerEvent = read.getEvent(ev.ref);
          if (consumerEvent && consumerEvent.ref) {
            const castEvent = read.getEvent(consumerEvent.ref);
            if (
              castEvent &&
              castEvent.type === "castStart" &&
              castEvent.sourceId === selfId &&
              castEvent.skillType === "normalSkill"
            ) {
              yield emit.spReturn({
                sourceId: selfId,
                amount: 50,
              });
            }
          }
        }
      },
    });

    registry.registerOnBuffApply({
      id: "operator.endministrator.potential2.shareAtkBuff.high",
      when: { buffId: "buff.endministrator.talent1.atkInc" },
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "buffApply" || ev.targetId !== selfId) return;
        const build = read.getBuild(selfId);
        if (Number(build?.potentialRank ?? 0) < 2) return;

        const targetIds = Object.values(read.env.entitiesById)
          .filter(e => e.type === "operator" && e.id !== selfId)
          .map(e => e.id);

        for (const targetId of targetIds) {
          yield emit.buffApply({
            sourceId: selfId,
            targetId: targetId,
            buffId: "buff.endministrator.potential2.teamAtkShare.high",
          });
        }
      },
    });

    registry.registerOnBuffApply({
      id: "operator.endministrator.potential2.shareAtkBuff.low",
      when: { buffId: "buff.endministrator.talent1.atkInc.low" },
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "buffApply" || ev.targetId !== selfId) return;
        const build = read.getBuild(selfId);
        if (Number(build?.potentialRank ?? 0) < 2) return;

        const targetIds = Object.values(read.env.entitiesById)
          .filter(e => e.type === "operator" && e.id !== selfId)
          .map(e => e.id);

        for (const targetId of targetIds) {
          yield emit.buffApply({
            sourceId: selfId,
            targetId: targetId,
            buffId: "buff.endministrator.potential2.teamAtkShare.low",
          });
        }
      },
    });
  }
}

export default new EndministratorDef();
