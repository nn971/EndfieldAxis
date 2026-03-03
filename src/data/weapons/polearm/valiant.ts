import { WeaponDef } from "../WeaponDef";

class ValiantDef extends WeaponDef {
  constructor() {
    super({
      id: "valiant",
      name: "Valiant",
      type: "polearm",
      icon: "VALIANT.png",
      atkStat: {
        level1: 50,
        level90: 495,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "physicaldmgboost", size: "L" },
      s3: {
        id: "virtuousgain",
        cat: "combative",
        name: "Virtuous Gain",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.26, 0.28];
            return values[r] ?? 0.15;
          },
        },
      },
    });
  }
}

export default new ValiantDef();
