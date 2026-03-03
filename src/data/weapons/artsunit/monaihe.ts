import { WeaponDef } from "../WeaponDef";

class MonaiheDef extends WeaponDef {
  constructor() {
    super({
      id: "monaihe",
      name: "Monaihe",
      type: "artsunit",
      icon: "MONAIHE.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "attackboost", size: "M" },
      s3: {
        id: "monaihe_mortiseandtenonanalysis",
        cat: "combative",
        name: "Mortise-and-Tenon Analysis",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.14, 0.154, 0.168, 0.182, 0.196, 0.21, 0.224, 0.238, 0.252];
            return values[r] ?? 0.14;
          },
        },
      },
    });
  }
}

export default new MonaiheDef();
