import { OperatorDef, OperatorDefInit } from "./OperatorDef";

const NS_DMG_MUL = [
  0.89, 0.98, 1.07, 1.16, 1.24, 1.33, 1.42, 1.51, 1.6, 1.71, 1.85, 2.0,
] as const;

const CS_DMG_MUL = [
  1.51, 1.66, 1.81, 1.96, 2.11, 2.27, 2.42, 2.57, 2.72, 2.91, 3.13, 3.4,
] as const;

const CS_COOLDOWN_SECONDS = [
  25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24,
] as const;

const NA_HIT1_DMG_MUL = new Array(12).fill(0.23) as readonly number[];
const NA_HIT2_DMG_MUL = new Array(12).fill(0.28) as readonly number[];
const NA_HIT3_DMG_MUL = new Array(12).fill(0.34) as readonly number[];
const NA_HIT4_DMG_MUL = new Array(12).fill(0.51) as readonly number[];

class AntalDef extends OperatorDef {
  constructor() {
    super({
      id: "antal",
      name: "Antal",
      avatar: "ANTAL.png",
      attributes: {
        main: "intellect",
        sub: "strength",
      },
      stats: {
        level1: {
          attack: 30,
          strength: 15,
          agility: 9,
          intellect: 15,
          will: 9,
        },
        level90: {
          attack: 297,
          strength: 129,
          agility: 86,
          intellect: 165,
          will: 82,
        },
      },
      weaponType: "artsunit",
      skills: {
        normalAttack: {
          name: "Exchange Current",
          durationFrames: 300,
          icon: "ANTAL_NA.png",
          staggerOnHit: 15,
        },
        normalSkill: {
          name: "Specified Research Subject",
          durationFrames: 60,
          icon: "ANTAL_NS.png",
        },
        comboSkill: {
          name: "EMP Test Site",
          durationFrames: 60,
          icon: "ANTAL_CS.png",
        },
        ultimate: {
          name: "Overclocked Moment",
          durationFrames: 120,
          icon: "ANTAL_ULT.png",
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

export default new AntalDef();
