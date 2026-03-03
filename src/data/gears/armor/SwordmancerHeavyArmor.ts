import { GearsDef } from "../GearsDef";

class SwordmancerHeavyArmorDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_phy01_body_02",
      type: "armor",
      name: "Swordmancer Heavy Armor",
      icon: "item_equip_t4_suit_phy01_body_02.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20, 22, 24, 26],
      },
    });
  }
}

export default new SwordmancerHeavyArmorDef();
