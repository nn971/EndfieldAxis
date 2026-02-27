import { OperatorDef, OperatorDefInit } from "./OperatorDef";

class AleshDef extends OperatorDef {
  constructor() {
    super({
      id: "alesh",
      name: "Alesh",
      avatar: "ALESH.png",
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

export default new AleshDef();
