import { OperatorDef, OperatorDefInit } from "./OperatorDef";

class EstellaDef extends OperatorDef {
  constructor() {
    super({
      id: "estella",
      name: "Estella",
      avatar: "ESTELLA.png",
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
      weaponType: "polearm",
      skills: {},
    } satisfies OperatorDefInit);
  }
}

export default new EstellaDef();
