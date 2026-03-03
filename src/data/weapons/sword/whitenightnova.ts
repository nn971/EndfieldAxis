import { WeaponDef } from "../WeaponDef";

class WhiteNightNovaDef extends WeaponDef {
  constructor() {
    super({
      id: "whitenightnova",
      name: "White Night Nova",
      type: "sword",
      icon: "WHITENIGHTNOVA.png",
      atkStat: {
        level1: 51,
        level90: 505,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "whitenightnova",
        cat: "infliction",
        name: "Infliction: White Night Nova",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => {
            const values = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 33, 36];
            return values[r] ?? 12;
          },
        },
      },
    });
  }
}

export default new WhiteNightNovaDef();
