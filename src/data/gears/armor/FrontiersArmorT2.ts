import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersArmorT2Def extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_body_04",
      type: "armor",
      name: "Frontiers Armor T2",
      icon: "item_equip_t4_suit_atb01_body_04.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "intellect",
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

export default new FrontiersArmorT2Def();
