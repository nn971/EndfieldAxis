import { GearsDef } from "../GearsDef";

class BonekrushaHeavyArmorDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_body_01",
      type: "armor",
      name: "Bonekrusha Heavy Armor",
      icon: "item_equip_t4_suit_attri01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "intellect",
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

export default new BonekrushaHeavyArmorDef();
