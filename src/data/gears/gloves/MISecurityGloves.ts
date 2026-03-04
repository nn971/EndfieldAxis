import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityGlovesDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_hand_01",
      type: "gloves",
      name: "MI Security Gloves",
      icon: "item_equip_t4_suit_criti01_hand_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [0.207, 0.228, 0.248, 0.269],
      },
    });
  }
}

export default new MISecurityGlovesDef();
