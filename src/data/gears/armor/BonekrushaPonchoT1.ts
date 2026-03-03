import { BonekrushaSetDef } from "../abstractSet/BonekrushaSetDef";

class BonekrushaPonchoT1Def extends BonekrushaSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_body_04",
      type: "armor",
      name: "Bonekrusha Poncho T1",
      icon: "item_equip_t4_suit_attri01_body_04.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "agility",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [12.3, 13.6, 14.8, 16.0],
      },
    });
  }
}

export default new BonekrushaPonchoT1Def();
