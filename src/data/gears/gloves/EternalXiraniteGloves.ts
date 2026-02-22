import { GearsDef } from "../GearsDef";

class EternalXiraniteGlovesDef extends GearsDef {
  constructor() {
    super({
      id: "eternalxiranitegloves",
      type: "gloves",
      name: "Eternal Xiranite Gloves",
      icon: "ETERNALXIRANITEGLOVES.png",
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

export default new EternalXiraniteGlovesDef();
