import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.85, 3.02, 3.2, 3.42, 3.69, 4.0,
] as const;

const CS_DMG_MUL_SEQ1 = [
  0.25, 0.27, 0.3, 0.32, 0.34, 0.37, 0.39, 0.42, 0.44, 0.47, 0.51, 0.55,
] as const;

const CS_DMG_MUL_SEQ2 = [
  1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25,
] as const;

const CS_COOLDOWN_SECONDS = [
  35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 33,
] as const;

const ULT_DMG_MUL_SEQ1 = [
  0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2.0,
] as const;

const ULT_DMG_MUL_SEQ2 = [
  1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7,
] as const;

const ULT_DMG_MUL_SEQ3 = [
  1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4.0,
] as const;

const NA_HIT1_DMG_MUL = new Array(12).fill(0.35) as readonly number[];
const NA_HIT2_DMG_MUL = new Array(12).fill(0.39) as readonly number[];
const NA_HIT3_DMG_MUL = new Array(12).fill(0.54) as readonly number[];
const NA_HIT4_DMG_MUL = new Array(12).fill(0.71) as readonly number[];

class CatcherDef extends OperatorDef {
  constructor() {
    super({
      id: "catcher",
      name: "Catcher",
      avatar: "CATCHER.png",
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
          will: 11,
        },
        level90: {
          attack: 300,
          strength: 176,
          agility: 96,
          intellect: 86,
          will: 106,
        },
      },
      weaponType: "greatsword",
      skills: {
        normalAttack: {
          name: "Basic Tactics",
          durationFrames: 300,
          icon: "CATCHER_NA.png",
          staggerOnHit: 22,
        },
        normalSkill: {
          name: "Rigid Interdiction",
          durationFrames: 60,
          icon: "CATCHER_NS.png",
        },
        comboSkill: {
          name: "Timely Suppression",
          durationFrames: 60,
          icon: "CATCHER_CS.png",
        },
        ultimate: {
          name: "Textbook Assault",
          durationFrames: 120,
          icon: "CATCHER_ULT.png",
        },
      },
    } satisfies OperatorDefInit);
  }

  override getComboCooldownSecondsByRank(): readonly number[] | null {
    return CS_COOLDOWN_SECONDS;
  }

  override getUltimateEnergyCost(): number {
    return 80;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 6;
  }
}

export default new CatcherDef();
