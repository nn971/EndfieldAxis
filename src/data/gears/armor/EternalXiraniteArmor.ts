import { GearsDef } from "../GearsDef";

class EternalXiraniteArmorDef extends GearsDef {
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
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [0, 0, 0, 0],
        s2: [0, 0, 0, 0],
        s3: [0, 0, 0, 0],
      },
    });
  }
}

export default new EternalXiraniteArmorDef();
