import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungHeavyArmorDef extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_body_01",
      type: "armor",
      name: "Type 50 Yinglung Heavy Armor",
      icon: "item_equip_t4_suit_atk02_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [0.115, 0.127, 0.138, 0.149],
      },
    });
  }
}

export default new Type50YinglungHeavyArmorDef();
