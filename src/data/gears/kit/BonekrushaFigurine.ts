import { BonekrushaSetDef } from "../abstractSet/BonekrushaSetDef";

class BonekrushaFigurineDef extends BonekrushaSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_attri01_edc_03",
      type: "kit",
      name: "Bonekrusha Figurine",
      icon: "item_equip_t4_suit_attri01_edc_03.png",
      defend: 28,
      bonusBuckets: {
        s1: "will",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [0.207, 0.228, 0.248, 0.269],
      },
    });
  }
}

export default new BonekrushaFigurineDef();
