import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkGauntletsDef extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_hand_02",
      type: "gloves",
      name: "Hot Work Gauntlets",
      icon: "item_equip_t4_suit_fire_natr01_hand_02.png",
      defend: 42,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [19.2, 21.1, 23.0, 24.9],
      },
    });
  }
}

export default new HotWorkGauntletsDef();
