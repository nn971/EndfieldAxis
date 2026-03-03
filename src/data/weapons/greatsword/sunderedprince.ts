import { WeaponDef } from "../WeaponDef";

class SunderedPrinceDef extends WeaponDef {
  constructor() {
    super({
      id: "sunderedprince",
      name: "Sundered Prince",
      type: "greatsword",
      icon: "SUNDEREDPRINCE.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "physicaldmgboost", size: "L" },
      s3: {
        id: "crusherprincelydeterrence",
        cat: "combative",
        name: "Crusher: Princely Deterrence",
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

export default new SunderedPrinceDef();
