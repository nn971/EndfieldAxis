import { AethertechSetDef } from "../abstractSet/AethertechSetDef";

class AethertechStabilizerDef extends AethertechSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_poise01_edc_02",
      type: "kit",
      name: "Æthertech Stabilizer",
      icon: "item_equip_t4_suit_poise01_edc_02.png",
      defend: 21,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [34, 37, 41, 44],
      },
    });
  }
}

export default new AethertechStabilizerDef();
