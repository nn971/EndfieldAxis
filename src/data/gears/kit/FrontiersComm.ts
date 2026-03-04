import { FrontiersSetDef } from "../abstractSet/FrontiersSetDef";

class FrontiersCommDef extends FrontiersSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atb01_edc_01",
      type: "kit",
      name: "Frontiers Comm",
      icon: "item_equip_t4_suit_atb01_edc_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "strength",
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

export default new FrontiersCommDef();
