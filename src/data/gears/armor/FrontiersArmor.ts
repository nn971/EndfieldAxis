import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersArmorDef extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_body_01",
      type: "armor",
      name: "Frontiers Armor",
      icon: "item_equip_t4_suit_atb01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "intellect",
        s3: "ultimateDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [0.259, 0.285, 0.311, 0.336],
      },
    });
  }
}

export default new FrontiersArmorDef();
