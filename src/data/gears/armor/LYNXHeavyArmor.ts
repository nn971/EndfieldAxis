import { GearsDef } from "../GearsDef";

class LYNXHeavyArmorDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_body_01",
      type: "armor",
      name: "LYNX Heavy Armor",
      icon: "item_equip_t4_suit_heal01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new LYNXHeavyArmorDef();
