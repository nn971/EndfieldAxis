import { MISecuritySetDef } from "../abstractSet/MISecuritySetDef";

class MISecurityOverallsT1Def extends MISecuritySetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_criti01_body_03",
      type: "armor",
      name: "MI Security Overalls T1",
      icon: "item_equip_t4_suit_criti01_body_03.png",
      defend: 56,
      bonusBuckets: {
        s1: "intellect",
        s2: "will",
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new MISecurityOverallsT1Def();
