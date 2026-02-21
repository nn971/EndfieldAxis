import { WeaponDef } from "../WeaponDef";

class SunderingSteelDef extends WeaponDef {
  constructor() {
    super({
      id: "sunderingsteel",
      name: "Sundering Steel",
      type: "sword",
      icon: "SUNDERINGSTEEL.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      skills: {
        1: "agilityboost.M",
        2: "physicaldmgboost.M",
        3: { id: "combative", name: "Anthem of Cinder" },
      },
    });
  }
}

export default new SunderingSteelDef();
