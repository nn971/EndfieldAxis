import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Turbid Avatar - 3 hits (2 identical + 1 slam)
const NS_DMG_MUL_1 = [
  0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86,
] as const;
const NS_DMG_MUL_2 = [
  0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86,
] as const;
const NS_DMG_MUL_3 = [
  1.19, 1.31, 1.43, 1.55, 1.67, 1.78, 1.9, 2.02, 2.14, 2.29, 2.47, 2.68,
] as const;

// Combo Skill: Aspect of Wrath - 2 hits
const CS_DMG_MUL_1 = [
  0.47, 0.51, 0.56, 0.61, 0.65, 0.7, 0.75, 0.79, 0.84, 0.9, 0.97, 1.05,
] as const;
const CS_DMG_MUL_2 = [
  1.67, 1.83, 2.0, 2.17, 2.33, 2.5, 2.67, 2.83, 3.0, 3.21, 3.46, 3.75,
] as const;

// Ultimate: Heart of the Unmoving - 2 hits + bonus with Link
const ULT_DMG_MUL_1 = [
  1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4.0,
] as const;
const ULT_DMG_MUL_2 = [
  1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4.0,
] as const;
const ULT_BONUS_DMG_MUL = [
  2.67, 2.94, 3.2, 3.47, 3.74, 4.0, 4.27, 4.54, 4.8, 5.14, 5.54, 6.0,
] as const;

// Normal Attack: Ruination - 4 hits
const NA_HIT1_DMG_MUL = [
  0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55,
] as const;
const NA_HIT2_DMG_MUL = [
  0.29, 0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.49, 0.52, 0.56, 0.6, 0.65,
] as const;
const NA_HIT3_DMG_MUL = [
  0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79,
] as const;
const NA_HIT4_DMG_MUL = [
  0.68, 0.74, 0.81, 0.88, 0.95, 1.01, 1.08, 1.15, 1.22, 1.3, 1.4, 1.52,
] as const;

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

class LifengDef extends OperatorDef {
  constructor() {
    super({
      id: "lifeng",
      name: "Lifeng",
      avatar: "LIFENG.png",
      attributes: {
        main: "agility",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 14,
          agility: 20,
          intellect: 13,
          will: 12,
        },
        level90: {
          attack: 312,
          strength: 123,
          agility: 132,
          intellect: 115,
          will: 117,
        },
      },
      weaponType: "polearm",
      skills: {
        normalAttack: {
          name: "Ruination",
          durationFrames: 240,
          icon: "LIFENG_NA.png",
          staggerOnHit: 17,
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 17,
            });
          },
        },
        normalSkill: {
          name: "Turbid Avatar",
          durationFrames: 90,
          icon: "LIFENG_NS.png",
          script: function* (ctx) {
            yield delay(30);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL_1[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(20);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL_2[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(25);
            yield ctx.emit.statusApply({
              statusType: "knockDown",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL_3[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Aspect of Wrath",
          durationFrames: 70,
          icon: "LIFENG_CS.png",
          script: function* (ctx) {
            yield delay(25);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => CS_DMG_MUL_1[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(30);
            yield ctx.emit.buffApply({
              buffId: "buff.link",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => CS_DMG_MUL_2[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Heart of the Unmoving",
          durationFrames: 120,
          icon: "LIFENG_ULT.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.statusApply({
              statusType: "knockDown",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => ULT_DMG_MUL_1[r] ?? 0),
              staggerOnHit: 5,
            });
            yield delay(40);
            yield ctx.emit.statusApply({
              statusType: "knockDown",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => ULT_DMG_MUL_2[r] ?? 0),
              staggerOnHit: 5,
            });
            // Bonus damage if Link buff is consumed
            yield delay(1);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: ctx.byRank!(r => ULT_BONUS_DMG_MUL[r] ?? 0),
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
    return 90;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;

    // Talent 2: Subduer of Evil - Deal bonus damage when applying Knock Down
    registry.registerOnStatusApply({
      id: "operator.lifeng.talent2.subduerOfEvil",
      fn: function* (ctx) {
        const { read, ev, emit, sourceId } = ctx;
        if (ev?.type !== "statusApply" || ev.statusType !== "knockDown") return;
        if (!sourceId || sourceId !== selfId) return;

        // TODO: Check talent rank and apply bonus damage
        // E2: 50% ATK, E3: 100% ATK
        yield emit.hit({
          sourceId: selfId,
          targetId: ev.targetId,
          damageType: "physical",
          dmgMultiplier: 0.5, // Base talent value (E2)
        });
      },
    });
  }
}

export default new LifengDef();
