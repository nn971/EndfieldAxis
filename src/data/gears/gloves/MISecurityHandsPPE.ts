import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityHandsPPEDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_hand_02",
      type: "gloves",
      name: "MI Security Hands PPE",
      icon: "item_equip_t4_suit_criti01_hand_02.png",
      defend: 28,
      bonusBuckets: {
        s1: "intellect",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [13.8, 15.2, 16.6, 17.9],
      },
    });
  }
}

export default new MISecurityHandsPPEDef();
