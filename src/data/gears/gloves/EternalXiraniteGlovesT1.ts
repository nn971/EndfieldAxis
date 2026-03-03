import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiraniteGlovesT1Def extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_usp02_hand_02",
      type: "gloves",
      name: "Eternal Xiranite Gloves T1",
      icon: "item_equip_t4_suit_usp02_hand_02.png",
      defend: 42,
      bonusBuckets: {
        s1: "intellect",
        s2: "will",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [20.5, 22.6, 24.6, 26.7],
      },
    });
  }
}

export default new EternalXiraniteGlovesT1Def();
