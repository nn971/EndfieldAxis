import { GearsDef } from "../GearsDef";

class FrontiersArmorT1Def extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_body_03",
      type: "armor",
      name: "Frontiers Armor T1",
      icon: "item_equip_t4_suit_atb01_body_03.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new FrontiersArmorT1Def();
