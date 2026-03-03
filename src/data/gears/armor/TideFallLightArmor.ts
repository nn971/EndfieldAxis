import { TideSurgeSetDef } from "../abstractSet/TideSurgeSetDef";

class TideFallLightArmorDef extends TideSurgeSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_burst01_body_01",
      type: "armor",
      name: "Tide Fall Light Armor",
      icon: "item_equip_t4_suit_burst01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [12.3, 13.6, 14.8, 16.0],
      },
    });
  }
}

export default new TideFallLightArmorDef();
