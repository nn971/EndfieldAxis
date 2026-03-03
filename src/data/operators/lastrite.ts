import type { SimRegistry } from "../../simulator/listeners/registry";
import { pickSkillValueByRank } from "../../simulator/scripts";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Esoteric Legacy of Seš'qa
const NS_DMG_MUL = [
  1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.80, 2.99, 3.23, 3.50,
] as const;

// Combo Skill: Winter's Devourer
const CS_DMG_MUL = [
  2.00, 2.20, 2.40, 2.60, 2.80, 3.00, 3.20, 3.40, 3.60, 3.85, 4.15, 4.50,
] as const;

// Ultimate: Vigil Services
const ULT_DMG_MUL = [
  4.44, 4.89, 5.33, 5.78, 6.22, 6.67, 7.11, 7.56, 8.00, 8.55, 9.22, 10.00,
] as const;

// Normal Attack: Dance of Rime - 4 hits
const NA_HIT1_DMG_MUL = [
  0.30, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68,
] as const;
const NA_HIT2_DMG_MUL = [
  0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24,
] as const;
const NA_HIT3_DMG_MUL = [
  0.68, 0.75, 0.82, 0.88, 0.95, 1.02, 1.09, 1.16, 1.22, 1.31, 1.41, 1.53,
] as const;
const NA_HIT4_DMG_MUL = [
  0.90, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03,
] as const;

const CS_COOLDOWN_SECONDS = [
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15,
] as const;

class LastRiteDef extends OperatorDef {
  constructor() {
    super({
      id: "lastrite",
      name: "Last Rite",
      avatar: "LASTRITE.png",
      attributes: {
        main: "strength",
        sub: "will",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 21,
          agility: 8,
          intellect: 9,
          will: 15,
        },
        level90: {
          attack: 332,
          strength: 155,
          agility: 104,
          intellect: 93,
          will: 109,
        },
      },
      weaponType: "greatsword",
      skills: {
        normalAttack: {
          name: "Dance of Rime",
          durationFrames: 260,
          icon: "LASTRITE_NA.png",
          staggerOnHit: 25,
          script: function* (ctx) {
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT1_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT2_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT3_DMG_MUL),
              staggerOnHit: 0,
            });
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NA_HIT4_DMG_MUL),
              staggerOnHit: 25,
            });
          },
        },
        normalSkill: {
          name: "Esoteric Legacy of Seš'qa",
          durationFrames: 80,
          icon: "LASTRITE_NS.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, NS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Winter's Devourer",
          durationFrames: 85,
          icon: "LASTRITE_CS.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: pickSkillValueByRank(ctx, CS_DMG_MUL),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Vigil Services",
          durationFrames: 130,
          icon: "LASTRITE_ULT.png",
          script: function* (ctx) {
            yield delay(55);
            yield ctx.emit.hit({
              damageType: "cryo",
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
    return 9;
  }

  override registerSimPlugins(_registry: SimRegistry): void {
    // Talent 1: Hypothermia - Apply Cryo Susceptibility after consuming Arts Infliction
    // Talent 2: Cryogenic Embrittlement - Ultimate bonus against Cryo Susceptibility
  }
}

export default new LastRiteDef();
