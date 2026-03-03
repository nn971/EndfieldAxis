import { TideSurgeSetDef } from "../abstractSet/TideSurgeSetDef";

class TideSurgeGauntletsDef extends TideSurgeSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_burst01_hand_01",
      type: "gloves",
      name: "Tide Surge Gauntlets",
      icon: "item_equip_t4_suit_burst01_hand_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new TideSurgeGauntletsDef();
