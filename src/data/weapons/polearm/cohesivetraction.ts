import { WeaponDef } from "../WeaponDef";

class CohesiveTractionDef extends WeaponDef {
  constructor() {
    super({
      id: "cohesivetraction",
      name: "Cohesive Traction",
      type: "polearm",
      icon: "COHESIVETRACTION.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "suppressionconcentriccircles",
        cat: "combative",
        name: "Concentric Circles",
        bonus: {
          bucket: "physicalDmgIncRatio",
          byRank: r => {
            const values = [0.28, 0.308, 0.336, 0.364, 0.392, 0.42, 0.448, 0.476, 0.504];
            return values[r] ?? 0.28;
          },
        },
      },
    });
  }
}

export default new CohesiveTractionDef();
