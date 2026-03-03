import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityArmorDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_body_01",
      type: "armor",
      name: "MI Security Armor",
      icon: "item_equip_t4_suit_criti01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20, 22, 24, 26],
      },
    });
  }
}

export default new MISecurityArmorDef();
