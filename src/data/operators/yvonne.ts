import type { SimRegistry } from "../../simulator/listeners/registry";
import { delay } from "../../simulator/scripts";
import { OperatorDef, OperatorDefInit } from "./OperatorDef";

// Normal Skill: Brr-Brr-Bomb β
const NS_DMG_MUL = [
  1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2.00, 2.14, 2.30, 2.50,
] as const;

// Combo Skill: Flashfreezer υ37
const CS_DMG_MUL = [
  2.69, 2.94, 3.23, 3.48, 3.73, 4.02, 4.26, 4.55, 4.80, 5.15, 5.57, 6.00,
] as const;

// Ultimate: Cryoblasting Pistolier
const ULT_DMG_MUL = [
  1.33, 1.47, 1.60, 1.73, 1.86, 2.00, 2.13, 2.26, 2.40, 2.56, 2.76, 3.00,
] as const;

// Normal Attack: Exuberant Trigger - 5 hits
const NA_HIT1_DMG_MUL = [
  0.24, 0.26, 0.28, 0.31, 0.33, 0.35, 0.38, 0.40, 0.42, 0.45, 0.49, 0.53,
] as const;
const NA_HIT2_DMG_MUL = [
  0.25, 0.28, 0.30, 0.33, 0.35, 0.38, 0.40, 0.43, 0.45, 0.48, 0.52, 0.56,
] as const;
const NA_HIT3_DMG_MUL = [
  0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.50, 0.54, 0.57, 0.61, 0.65, 0.71,
] as const;
const NA_HIT4_DMG_MUL = [
  0.41, 0.45, 0.49, 0.53, 0.58, 0.62, 0.66, 0.70, 0.74, 0.79, 0.85, 0.92,
] as const;
const NA_HIT5_DMG_MUL = [
  0.56, 0.62, 0.67, 0.73, 0.79, 0.84, 0.90, 0.96, 1.01, 1.08, 1.17, 1.26,
] as const;

const CS_COOLDOWN_SECONDS = [
  20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18,
] as const;

class YvonneDef extends OperatorDef {
  constructor() {
    super({
      id: "yvonne",
      name: "Yvonne",
      avatar: "YVONNE.png",
      attributes: {
        main: "intellect",
        sub: "agility",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 8,
          agility: 14,
          intellect: 24,
          will: 10,
        },
        level90: {
          attack: 321,
          strength: 82,
          agility: 128,
          intellect: 176,
          will: 105,
        },
      },
      weaponType: "handcannon",
      skills: {
        normalAttack: {
          name: "Exuberant Trigger",
          durationFrames: 260,
          icon: "YVONNE_NA.png",
          staggerOnHit: 17,
          script: function* (ctx) {
            yield delay(35);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NA_HIT1_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(35);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NA_HIT2_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(40);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NA_HIT3_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(45);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NA_HIT4_DMG_MUL[r] ?? 0),
              staggerOnHit: 0,
            });
            yield delay(50);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NA_HIT5_DMG_MUL[r] ?? 0),
              staggerOnHit: 17,
            });
          },
        },
        normalSkill: {
          name: "Brr-Brr-Bomb β",
          durationFrames: 75,
          icon: "YVONNE_NS.png",
          script: function* (ctx) {
            yield delay(35);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => NS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        comboSkill: {
          name: "Flashfreezer υ37",
          durationFrames: 90,
          icon: "YVONNE_CS.png",
          script: function* (ctx) {
            yield delay(40);
            yield ctx.emit.buffApply({
              buffId: "buff.solidification",
            });
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => CS_DMG_MUL[r] ?? 0),
              staggerOnHit: 10,
            });
          },
        },
        ultimate: {
          name: "Cryoblasting Pistolier",
          durationFrames: 210,
          icon: "YVONNE_ULT.png",
          script: function* (ctx) {
            yield delay(60);
            yield ctx.emit.hit({
              damageType: "cryo",
              dmgMultiplier: ctx.byRank!(r => ULT_DMG_MUL[r] ?? 0),
              staggerOnHit: 20,
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
    return 220;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 7;
  }

  override registerSimPlugins(_registry: SimRegistry): void {
    // Talent 1: Barrage of Technology - Next BA becomes Final Strike after applying Solidification
    // Talent 2: Freezing Point - Critical DMG bonus against Cryo Infliction
  }
}

export default new YvonneDef();
