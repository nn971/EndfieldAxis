import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityHandsPPET1Def extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_hand_03",
      type: "gloves",
      name: "MI Security Hands PPE T1",
      icon: "item_equip_t4_suit_criti01_hand_03.png",
      defend: 28,
      bonusBuckets: {
        s1: "intellect",
        s2: "will",
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new MISecurityHandsPPET1Def();
