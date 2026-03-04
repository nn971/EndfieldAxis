import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungLightArmorDef extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_body_04",
      type: "armor",
      name: "Type 50 Yinglung Light Armor",
      icon: "item_equip_t4_suit_atk02_body_04.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "strength",
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

export default new Type50YinglungLightArmorDef();
