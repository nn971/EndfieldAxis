import { WeaponDef } from "../WeaponDef";

class FreedomToProselytizeDef extends WeaponDef {
  constructor() {
    super({
      id: "freedomtoproselytize",
      name: "Freedom to Proselytize",
      type: "artsunit",
      icon: "FREEDOMTOPROSELYTIZE.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "freedomtoproselytize_redemptionoffaith",
        cat: "combative",
        name: "Redemption of Faith",
        bonus: {
          bucket: "will",
          byRank: r => {
            const values = [14, 15.4, 16.8, 18.2, 19.6, 21, 22.4, 23.8, 25.2];
            return values[r] ?? 14;
          },
        },
      },
    });
  }
}

export default new FreedomToProselytizeDef();
