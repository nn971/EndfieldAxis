import { WeaponDef } from "../WeaponDef";

class GrandVisionDef extends WeaponDef {
  constructor() {
    super({
      id: "grandvision",
      name: "Grand Vision",
      type: "sword",
      icon: "GRANDVISION.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      skills: {
        1: "agilityboost.L",
        2: "attackboost.L",
        3: { id: "infliction", name: "Long Time Wish" },
      },
    });
  }
}

export default new GrandVisionDef();
