import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Forward March - 1 hit
const NS_DMG_MUL = [
  1.73, 1.91, 2.08, 2.25, 2.43, 2.6, 2.77, 2.95, 3.12, 3.34, 3.6, 3.9,
] as const;

// Combo Skill: Frontline Support - 1 hit
const CS_DMG_MUL = [
  1.02, 1.12, 1.22, 1.33, 1.43, 1.53, 1.63, 1.73, 1.84, 1.96, 2.12, 2.3,
] as const;

// Ultimate: Re-Ignited Oath - 1 hit + shield
const ULT_DMG_MUL = [
  2.89, 3.18, 3.47, 3.76, 4.04, 4.33, 4.62, 4.91, 5.2, 5.56, 5.99, 6.5,
] as const;

// Normal Attack: Sword Art of Assault - 4 hits
const NA_HIT1_DMG_MUL = [
  0.38, 0.42, 0.46, 0.5, 0.54, 0.57, 0.61, 0.65, 0.69, 0.74, 0.79, 0.86,
] as const;
const NA_HIT2_DMG_MUL = [
  0.54, 0.59, 0.64, 0.7, 0.75, 0.8, 0.86, 0.91, 0.96, 1.03, 1.11, 1.2,
] as const;
const NA_HIT3_DMG_MUL = [
  0.66, 0.73, 0.8, 0.86, 0.93, 0.99, 1.06, 1.13, 1.19, 1.28, 1.38, 1.49,
] as const;
const NA_HIT4_DMG_MUL = [
  0.82, 0.9, 0.98, 1.06, 1.14, 1.22, 1.31, 1.39, 1.47, 1.57, 1.69, 1.84,
] as const;

const CS_COOLDOWN_SECONDS = [
  19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 18,
] as const;

class EmberDef extends OperatorDef {
  constructor() {
    super({
      id: "ember",
      name: "Ember",
      avatar: "EMBER.png",
      attributes: {
        main: "strength",
        sub: "will",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 21,
          agility: 9,
          intellect: 8,
          will: 13,
        },
        level90: {
          attack: 323,
          strength: 176,
          agility: 96,
          intellect: 86,
          will: 120,
        },
      },
      weaponType: "greatsword",
      skills: {
        normalAttack: {
          name: "Sword Art of Assault",
          durationFrames: 260,
          icon: "EMBER_NA.png",
          staggerOnHit: 20,
          script: function* (ctx) {
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT1_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(45);
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
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT4_DMG_MUL),
              staggerOnHit: 20,
            });
          },
        },
        normalSkill: {
          name: "Forward March",
          durationFrames: 80,
          icon: "EMBER_NS.png",
          script: function* (ctx) {
            yield delay(35);
            yield ctx.emit.statusApply({
              statusType: "knockDown",
            });
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Frontline Support",
          durationFrames: 75,
          icon: "EMBER_CS.png",
          script: function* (ctx) {
            yield delay(30);
            yield ctx.emit.statusApply({
              statusType: "knockDown",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, CS_DMG_MUL),
              staggerOnHit: 10,
            });
            // TODO: Healing effect based on Will attribute
          },
        },
        ultimate: {
          name: "Re-Ignited Oath",
          durationFrames: 100,
          icon: "EMBER_ULT.png",
          script: function* (ctx) {
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_DMG_MUL),
              staggerOnHit: 25,
            });
            // TODO: Apply shield to all teammates based on Max HP
          },
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 100;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 8;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    // Talent 2: Pay the Ferric Price - Gain ATK when receiving damage
    registry.registerAfterHit({
      id: "operator.ember.talent2.payTheFerricPrice",
      fn: function* ({ read, ev, emit }) {
        if (ev?.type !== "hit" || ev.targetId !== selfId) return;

        const source = ev.sourceId ? read.getEntity(ev.sourceId) : null;
        if (!source || source.type === "operator") return; // Only from enemies

        // TODO: Apply ATK buff based on talent rank
        // E2: ATK +6% for 7s, max 3 stacks
        // E3: ATK +9% for 7s, max 3 stacks
        yield emit.buffApply({
          sourceId: selfId,
          targetId: selfId,
          buffId: "buff.ember.talent2.atkInc",
        });
      },
    });
  }
}

export default new EmberDef();
