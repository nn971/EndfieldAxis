import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Arcane Staff: Gravity Mode
const NS_DMG_MUL = [
  0.97, 1.07, 1.17, 1.26, 1.36, 1.46, 1.56, 1.65, 1.75, 1.87, 2.02, 2.19,
] as const;

// Combo Skill: Arcane Staff: Matrix Displacement
const CS_DMG_MUL = [
  1.40, 1.54, 1.68, 1.82, 1.96, 2.10, 2.24, 2.38, 2.52, 2.70, 2.91, 3.15,
] as const;

// Ultimate: Arcane Staff: Gravity Field
const ULT_DMG_MUL = [
  3.11, 3.42, 3.73, 4.04, 4.36, 4.67, 4.98, 5.29, 5.60, 5.98, 6.45, 7.00,
] as const;

// Normal Attack: Arcane Staff: Beam Cohesion Arts - 4 hits
const NA_HIT1_DMG_MUL = [
  0.30, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68,
] as const;
const NA_HIT2_DMG_MUL = [
  0.36, 0.40, 0.43, 0.47, 0.50, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81,
] as const;
const NA_HIT3_DMG_MUL = [
  0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91,
] as const;
const NA_HIT4_DMG_MUL = [
  0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.96, 1.04, 1.12,
] as const;

const CS_COOLDOWN_SECONDS = [
  20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19,
] as const;

class GilbertaDef extends OperatorDef {
  constructor() {
    super({
      id: "gilberta",
      name: "Gilberta",
      avatar: "GILBERTA.png",
      attributes: {
        main: "will",
        sub: "intellect",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 9,
          agility: 9,
          intellect: 16,
          will: 20,
        },
        level90: {
          attack: 329,
          strength: 89,
          agility: 92,
          intellect: 127,
          will: 171,
        },
      },
      weaponType: "artsunit",
      skills: {
        normalAttack: {
          name: "Arcane Staff: Beam Cohesion Arts",
          durationFrames: 240,
          icon: "GILBERTA_NA.png",
          staggerOnHit: 16,
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 16,
            });
          },
        },
        normalSkill: {
          name: "Arcane Staff: Gravity Mode",
          durationFrames: 80,
          icon: "GILBERTA_NS.png",
          script: function* (ctx) {
            yield delay(35);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Arcane Staff: Matrix Displacement",
          durationFrames: 75,
          icon: "GILBERTA_CS.png",
          script: function* (ctx) {
            yield delay(25);
            yield ctx.emit.statusApply({
              statusType: "lift",
            });
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => CS_DMG_MUL[r] ?? 0),
              staggerOnHit: 5,
            });
          },
        },
        ultimate: {
          name: "Arcane Staff: Gravity Field",
          durationFrames: 120,
          icon: "GILBERTA_ULT.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "nature",
              dmgMultiplier: ctx.byRank!(r => ULT_DMG_MUL[r] ?? 0),
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
    // Talent 1: Messenger's Song - Passive team buff
    // Applied automatically through buff system
  }
}

export default new GilbertaDef();
