import { WeaponDef } from "../WeaponDef";

class ContingentMeasureDef extends WeaponDef {
  constructor() {
    super({
      id: "contingentmeasure",
      name: "Contingent Measure",
      type: "sword",
      icon: "CONTINGENTMEASURE.png",
      atkStat: { level1: 34, level90: 341 },
      s1: { id: "agilityboost", size: "S" },
      s2: { id: "physicaldmgboost", size: "S" },
      s3: {
        id: "suppressionemergencyboost",
        cat: "combative",
        name: "Suppression: Emergency Boost",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336];
            return values[r] ?? 0.12;
          },
        },
      },
    });
  }
}

export default new ContingentMeasureDef();
