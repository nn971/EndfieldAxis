import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityOverallsDef extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_body_02",
      type: "armor",
      name: "MI Security Overalls",
      icon: "item_equip_t4_suit_criti01_body_02.png",
      defend: 56,
      bonusBuckets: {
        s1: "intellect",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [0.138, 0.152, 0.166, 0.179],
      },
    });
  }
}

export default new MISecurityOverallsDef();
