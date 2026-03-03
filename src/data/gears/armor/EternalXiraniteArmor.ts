import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiraniteArmorDef extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "eternalxiranitearmor",
      type: "armor",
      name: "Eternal Xiranite Armor",
      icon: "ETERNALXIRANITEARMOR.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20, 22, 24, 26],
      },
    });
  }
}

export default new EternalXiraniteArmorDef();
