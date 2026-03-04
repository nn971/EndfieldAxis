import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkGauntletsT1Def extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_hand_03",
      type: "gloves",
      name: "Hot Work Gauntlets T1",
      icon: "item_equip_t4_suit_fire_natr01_hand_03.png",
      defend: 42,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [0.192, 0.211, 0.23, 0.249],
      },
    });
  }
}

export default new HotWorkGauntletsT1Def();
