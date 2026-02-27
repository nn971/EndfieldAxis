import { OperatorDef, OperatorDefInit } from "./OperatorDef";

class DaPanDef extends OperatorDef {
  constructor() {
    super({
      id: "dapan",
      name: "Da Pan",
      avatar: "DAPAN.png",
      attributes: {
        main: "strength",
        sub: "agility",
      },
      stats: {
        level1: {
          attack: 0,
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
        },
        level90: {
          attack: 0,
          strength: 0,
          agility: 0,
          intellect: 0,
          will: 0,
        },
      },
      weaponType: "sword",
      skills: {},
    } satisfies OperatorDefInit);
  }

  override getUltimateEnergyCost(): number {
    return 100;
  }

  override getComboUltimateEnergyGainOnHit(): number {
    return 6.5;
  }

}

export default new DaPanDef();
