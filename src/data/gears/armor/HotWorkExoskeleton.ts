import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkExoskeletonDef extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_body_01",
      type: "armor",
      name: "Hot Work Exoskeleton",
      icon: "item_equip_t4_suit_fire_natr01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "strength",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [0.115, 0.127, 0.138, 0.149],
      },
    });
  }
}

export default new HotWorkExoskeletonDef();
