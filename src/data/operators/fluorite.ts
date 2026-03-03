import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  1.87, 2.06, 2.24, 2.43, 2.62, 2.8, 2.99, 3.18, 3.36, 3.6, 3.88, 4.2,
] as const;

const CS_DMG_MUL = [
  1.69, 1.86, 2.03, 2.2, 2.37, 2.54, 2.7, 2.87, 3.04, 3.25, 3.51, 3.8,
] as const;

const CS_COOLDOWN_SECONDS = [
  40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 38,
] as const;

const ULT_DMG_MUL = [
  1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2.0, 2.14, 2.31, 2.5,
] as const;

const NA_HIT1_DMG_MUL = new Array(12).fill(0.25) as readonly number[];
const NA_HIT2_DMG_MUL = new Array(12).fill(0.33) as readonly number[];
const NA_HIT3_DMG_MUL = new Array(12).fill(0.26) as readonly number[];
const NA_HIT4_DMG_MUL = new Array(12).fill(0.6) as readonly number[];

class FluoriteDef extends OperatorDef {
  constructor() {
    super({
      id: "fluorite",
      name: "Fluorite",
      avatar: "FLUORITE.png",
      attributes: {
        main: "agility",
        sub: "intellect",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 14,
          agility: 14,
          intellect: 12,
          will: 10,
        },
        level90: {
          attack: 303,
          strength: 90,
          agility: 168,
          intellect: 114,
          will: 91,
        },
      },
      weaponType: "handcannon",
      skills: {
        normalAttack: {
          name: "Signature Gun Kata",
          durationFrames: 300,
          icon: "FLUORITE_NA.png",
          staggerOnHit: 15,
        },
        normalSkill: {
          name: "Tiny Surprise",
          durationFrames: 60,
          icon: "FLUORITE_NS.png",
        },
        comboSkill: {
          name: "Free Giveaway",
          durationFrames: 60,
          icon: "FLUORITE_CS.png",
        },
        ultimate: {
          name: "Apex Prankster",
          durationFrames: 120,
          icon: "FLUORITE_ULT.png",
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
    return 6;
  }
}

export default new FluoriteDef();
