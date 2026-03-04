import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiraniteGlovesDef extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_usp02_hand_01",
      type: "gloves",
      name: "Eternal Xiranite Gloves",
      icon: "item_equip_t4_suit_usp02_hand_01.png",
      defend: 42,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [0.205, 0.226, 0.246, 0.267],
      },
    });
  }
}

export default new EternalXiraniteGlovesDef();
