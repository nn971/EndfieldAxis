import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityOverallsT2Def extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_body_04",
      type: "armor",
      name: "MI Security Overalls T2",
      icon: "item_equip_t4_suit_criti01_body_04.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new MISecurityOverallsT2Def();
