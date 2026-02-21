import { OperatorDef, OperatorDefInit } from "./OperatorDef";

class AkekuriDef extends OperatorDef {
  constructor() {
    super({
      id: "akekuri",
      name: "Akekuri",
      avatar: "AKEKURI.png",
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
}

export default new AkekuriDef();
