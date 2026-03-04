import { AethertechSetDef } from "../abstractSet/AethertechSetDef";

class AethertechPlatingDef extends AethertechSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_poise01_body_01",
      type: "armor",
      name: "Æthertech Plating",
      icon: "item_equip_t4_suit_poise01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [0.207, 0.228, 0.248, 0.269],
      },
    });
  }
}

export default new AethertechPlatingDef();
