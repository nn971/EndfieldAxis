import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersExtraO2TubeDef extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_edc_04",
      type: "kit",
      name: "Frontiers Extra O2 Tube",
      icon: "item_equip_t4_suit_atb01_edc_04.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "intellect",
        s3: "strength",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new FrontiersExtraO2TubeDef();
