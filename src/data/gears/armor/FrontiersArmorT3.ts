import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersArmorT3Def extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_body_02",
      type: "armor",
      name: "Frontiers Armor T3",
      icon: "item_equip_t4_suit_atb01_body_02.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "intellect",
        s3: "atkIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [10.4, 11.4, 12.4, 13.5],
      },
    });
  }
}

export default new FrontiersArmorT3Def();
