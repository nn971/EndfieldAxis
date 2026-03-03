import { WeaponDef } from "../WeaponDef";

class KhravenggerDef extends WeaponDef {
  constructor() {
    super({
      id: "khravengger",
      name: "Khravengger",
      type: "greatsword",
      icon: "KHRAVENGGER.png",
      atkStat: {
        level1: 51,
        level90: 505,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "detonatebonechilling",
        cat: "infliction",
        name: "Detonate: Bonechilling",
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

export default new KhravenggerDef();
