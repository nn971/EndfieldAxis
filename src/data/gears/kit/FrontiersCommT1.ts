import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersCommT1Def extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_edc_02",
      type: "kit",
      name: "Frontiers Comm T1",
      icon: "item_equip_t4_suit_atb01_edc_02.png",
      defend: 28,
      bonusBuckets: {
        s1: "strength",
        s2: "intellect",
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new FrontiersCommT1Def();
