import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityArmbandDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_edc_01",
      type: "kit",
      name: "MI Security Armband",
      icon: "item_equip_t4_suit_criti01_edc_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new MISecurityArmbandDef();
