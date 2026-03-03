import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityPushKnifeDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_edc_04",
      type: "kit",
      name: "MI Security Push Knife",
      icon: "item_equip_t4_suit_criti01_edc_04.png",
      defend: 21,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new MISecurityPushKnifeDef();
