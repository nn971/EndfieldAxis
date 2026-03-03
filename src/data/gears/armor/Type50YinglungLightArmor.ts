import { GearsDef } from "../GearsDef";

class Type50YinglungLightArmorDef extends GearsDef {
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
        s3: [13.8, 15.2, 16.6, 17.9],
      },
    });
  }
}

export default new Type50YinglungLightArmorDef();
