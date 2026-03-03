import { AethertechSetDef } from "../abstractSet/AethertechSetDef";

class AethertechAnalysisBandDef extends AethertechSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_poise01_edc_01",
      type: "kit",
      name: "Æthertech Analysis Band",
      icon: "item_equip_t4_suit_poise01_edc_01.png",
      defend: 21,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [11.5, 12.7, 13.8, 14.9],
      },
    });
  }
}

export default new AethertechAnalysisBandDef();
