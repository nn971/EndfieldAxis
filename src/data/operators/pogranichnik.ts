import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: The Pulverizing Front
const NS_DMG_MUL = [
  1.92, 2.10, 2.30, 2.48, 2.68, 2.86, 3.06, 3.25, 3.44, 3.68, 3.96, 4.30,
] as const;

// Combo Skill: Full Moon Slash
const CS_DMG_MUL = [
  2.28, 2.50, 2.73, 2.97, 3.20, 3.42, 3.64, 3.87, 4.11, 4.39, 4.73, 5.14,
] as const;

// Ultimate: Shieldguard Banner, Forward
const ULT_DMG_MUL = [
  2.00, 2.20, 2.40, 2.60, 2.80, 3.00, 3.20, 3.40, 3.60, 3.85, 4.15, 4.50,
] as const;

// Normal Attack: All-Out Offensive - 5 hits
const NA_HIT1_DMG_MUL = [
  0.23, 0.25, 0.28, 0.30, 0.32, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52,
] as const;
const NA_HIT2_DMG_MUL = [
  0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.50, 0.54, 0.58, 0.63,
] as const;
const NA_HIT3_DMG_MUL = [
  0.33, 0.36, 0.40, 0.43, 0.46, 0.50, 0.53, 0.56, 0.59, 0.64, 0.68, 0.74,
] as const;
const NA_HIT4_DMG_MUL = [
  0.38, 0.42, 0.46, 0.50, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86,
] as const;
const NA_HIT5_DMG_MUL = [
  0.43, 0.47, 0.52, 0.56, 0.60, 0.65, 0.69, 0.73, 0.77, 0.83, 0.89, 0.97,
] as const;

const CS_COOLDOWN_SECONDS = [
  18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17,
] as const;

class PogranichnikDef extends OperatorDef {
  constructor() {
    super({
      id: "pogranichnik",
      name: "Pogranichnik",
      avatar: "POGRANICHNIK.png",
      attributes: {
        main: "will",
        sub: "agility",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 12,
          agility: 13,
          intellect: 10,
          will: 20,
        },
        level90: {
          attack: 321,
          strength: 101,
          agility: 110,
          intellect: 97,
          will: 173,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "All-Out Offensive",
          durationFrames: 280,
          icon: "POGRANICHNIK_NA.png",
          staggerOnHit: 18,
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT1_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT2_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT3_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(45);
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
          name: "The Pulverizing Front",
          durationFrames: 75,
          icon: "POGRANICHNIK_NS.png",
          script: function* (ctx) {
            yield delay(35);
            yield ctx.emit.statusApply({
              statusType: "breach",
            });
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
              staggerOnHit: 5,
            });
          },
        },
        comboSkill: {
          name: "Full Moon Slash",
          durationFrames: 70,
          icon: "POGRANICHNIK_CS.png",
          script: function* (ctx) {
            yield delay(30);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, CS_DMG_MUL),
              staggerOnHit: 9,
            });
          },
        },
        ultimate: {
          name: "Shieldguard Banner, Forward",
          durationFrames: 110,
          icon: "POGRANICHNIK_ULT.png",
          script: function* (ctx) {
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "physical",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_DMG_MUL),
              staggerOnHit: 15,
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

  override registerSimPlugins(_registry: SimRegistry): void {
    // Talent 1: The Living Banner - Buff on SP recovery
    // Talent 2: Tactical Instruction - Team buff from ultimate
  }
}

export default new PogranichnikDef();
