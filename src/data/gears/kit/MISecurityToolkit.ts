import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityToolkitDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_edc_03",
      type: "kit",
      name: "MI Security Toolkit",
      icon: "item_equip_t4_suit_criti01_edc_03.png",
      defend: 28,
      bonusBuckets: {
        s1: "intellect",
        s2: "agility",
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

export default new MISecurityToolkitDef();
