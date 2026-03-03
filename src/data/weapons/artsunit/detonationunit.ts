import { WeaponDef } from "../WeaponDef";

class DetonationUnitDef extends WeaponDef {
  constructor() {
    super({
      id: "detonationunit",
      name: "Detonation Unit",
      type: "artsunit",
      icon: "DETONATIONUNIT.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "attackboost", size: "L" },
      s2: { id: "physicaldmgboost", size: "L" },
      s3: {
        id: "detonateimposingchampion",
        cat: "combative",
        name: "Detonate: Imposing Champion",
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

export default new DetonationUnitDef();
