import { WeaponDef } from "../WeaponDef";

class RationalFarewellDef extends WeaponDef {
  constructor() {
    super({
      id: "rationalfarewell",
      name: "Rational Farewell",
      type: "handcannon",
      icon: "RATIONALFAREWELL.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "rationalfarewell_aidfromthepast",
        cat: "combative",
        name: "Aid from the Past",
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

export default new RationalFarewellDef();
