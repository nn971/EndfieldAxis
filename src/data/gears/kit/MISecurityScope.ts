import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityScopeDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_edc_02",
      type: "kit",
      name: "MI Security Scope",
      icon: "item_equip_t4_suit_criti01_edc_02.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new MISecurityScopeDef();
