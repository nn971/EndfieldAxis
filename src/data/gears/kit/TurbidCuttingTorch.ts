import { TideSurgeSetDef } from "../abstractSet/TideSurgeSetDef";

class TurbidCuttingTorchDef extends TideSurgeSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_burst01_edc_02",
      type: "kit",
      name: "Turbid Cutting Torch",
      icon: "item_equip_t4_suit_burst01_edc_02.png",
      defend: 28,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [13.8, 15.2, 16.6, 17.9],
      },
    });
  }
}

export default new TurbidCuttingTorchDef();
