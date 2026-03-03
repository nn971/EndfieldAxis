import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Smouldering Fire
const NS_DMG_MUL = [
  1.24, 1.36, 1.49, 1.61, 1.74, 1.86, 1.98, 2.11, 2.23, 2.39, 2.57, 2.79,
] as const;

// Combo Skill: Trailblaze Cleave
const CS_DMG_MUL = [
  1.60, 1.76, 1.92, 2.08, 2.24, 2.40, 2.56, 2.72, 2.88, 3.08, 3.32, 3.60,
] as const;

// Ultimate: Twilight
const ULT_DMG_MUL = [
  4.44, 4.89, 5.33, 5.78, 6.22, 6.67, 7.11, 7.56, 8.00, 8.55, 9.22, 10.00,
] as const;

// Normal Attack: Flaming Cinders - 5 hits
const NA_HIT1_DMG_MUL = [
  0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36,
] as const;
const NA_HIT2_DMG_MUL = [
  0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.50, 0.54,
] as const;
const NA_HIT3_DMG_MUL = [
  0.25, 0.28, 0.30, 0.33, 0.35, 0.38, 0.40, 0.43, 0.45, 0.48, 0.52, 0.56,
] as const;
const NA_HIT4_DMG_MUL = [
  0.39, 0.43, 0.47, 0.51, 0.55, 0.59, 0.62, 0.66, 0.70, 0.75, 0.81, 0.88,
] as const;
const NA_HIT5_DMG_MUL = [
  0.53, 0.58, 0.64, 0.69, 0.74, 0.80, 0.85, 0.90, 0.95, 1.02, 1.10, 1.19,
] as const;

const CS_COOLDOWN_SECONDS = [
  18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17,
] as const;

class LaevatainDef extends OperatorDef {
  constructor() {
    super({
      id: "laevatain",
      name: "Laevatain",
      avatar: "LAEVATAIN.png",
      attributes: {
        main: "intellect",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 13,
          agility: 9,
          intellect: 22,
          will: 9,
        },
        level90: {
          attack: 318,
          strength: 121,
          agility: 99,
          intellect: 177,
          will: 89,
        },
      },
      weaponType: "sword",
      skills: {
        normalAttack: {
          name: "Flaming Cinders",
          durationFrames: 280,
          icon: "LAEVATAIN_NA.png",
          staggerOnHit: 18,
          script: function* (ctx) {
            yield delay(38);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT1_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(38);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT2_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(38);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT3_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT4_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT5_DMG_MUL),
              staggerOnHit: 18,
            });
          },
        },
        normalSkill: {
          name: "Smouldering Fire",
          durationFrames: 85,
          icon: "LAEVATAIN_NS.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Trailblaze Cleave",
          durationFrames: 75,
          icon: "LAEVATAIN_CS.png",
          script: function* (ctx) {
            yield delay(30);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, CS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Twilight",
          durationFrames: 130,
          icon: "LAEVATAIN_ULT.png",
          script: function* (ctx) {
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "heat",
              dmgMultiplier: pickSkillValueByRank(ctx, ULT_DMG_MUL),
              staggerOnHit: 25,
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
    return 130;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(_registry: SimRegistry): void {
    // Talent 1: Scorching Heart - Absorb Heat Infliction
    // Talent 2: Re-Ignition - Survival mechanic
  }
}

export default new LaevatainDef();
