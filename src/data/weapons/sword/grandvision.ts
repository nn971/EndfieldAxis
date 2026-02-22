import { WeaponDef } from "../WeaponDef";

class GrandVisionDef extends WeaponDef {
  constructor() {
    super({
      id: "grandvision",
      name: "Grand Vision",
      type: "sword",
      icon: "GRANDVISION.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "longtimewish",
        cat: "infliction",
        name: "Long Time Wish",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => 24 + 6 * r + (r > 8 ? 6 : 0),
        },
      },
    });
  }
}

export default new GrandVisionDef();
