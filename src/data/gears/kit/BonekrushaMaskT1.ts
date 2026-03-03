import { BonekrushaSetDef } from "../abstractSet/BonekrushaSetDef";

class BonekrushaMaskT1Def extends BonekrushaSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_edc_05",
      type: "kit",
      name: "Bonekrusha Mask T1",
      icon: "item_equip_t4_suit_attri01_edc_05.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
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

export default new BonekrushaMaskT1Def();
