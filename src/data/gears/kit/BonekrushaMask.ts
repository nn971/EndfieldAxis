import { BonekrushaSetDef } from "../abstractSet/BonekrushaSetDef";

class BonekrushaMaskDef extends BonekrushaSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_edc_04",
      type: "kit",
      name: "Bonekrusha Mask",
      icon: "item_equip_t4_suit_attri01_edc_04.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new BonekrushaMaskDef();
