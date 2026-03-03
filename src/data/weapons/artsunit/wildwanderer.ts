import { WeaponDef } from "../WeaponDef";

class WildWandererDef extends WeaponDef {
  constructor() {
    super({
      id: "wildwanderer",
      name: "Wild Wanderer",
      type: "artsunit",
      icon: "WILDWANDERER.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "wildwanderer_wildernesscluster",
        cat: "infliction",
        name: "Wilderness Cluster",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => {
            const values = [28, 30.8, 33.6, 36.4, 39.2, 42, 44.8, 47.6, 50.4];
            return values[r] ?? 28;
          },
        },
      },
    });
  }
}

export default new WildWandererDef();
