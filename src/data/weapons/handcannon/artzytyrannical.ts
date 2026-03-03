import { WeaponDef } from "../WeaponDef";

class ArtzyTyrannicalDef extends WeaponDef {
  constructor() {
    super({
      id: "artzytyrannical",
      name: "Artzy Tyrannical",
      type: "handcannon",
      icon: "ARTZYTYRANNICAL.png",
      atkStat: {
        level1: 51,
        level90: 505,
      },
      s1: { id: "attackboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "fractureartzyexaggeration",
        cat: "combative",
        name: "Artzy Exaggeration",
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

export default new ArtzyTyrannicalDef();
