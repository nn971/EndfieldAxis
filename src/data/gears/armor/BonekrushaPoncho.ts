import { BonekrushaSetDef } from "../abstractSet/BonekrushaSetDef";

class BonekrushaPonchoDef extends BonekrushaSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_body_03",
      type: "armor",
      name: "Bonekrusha Poncho",
      icon: "item_equip_t4_suit_attri01_body_03.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "strength",
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

export default new BonekrushaPonchoDef();
