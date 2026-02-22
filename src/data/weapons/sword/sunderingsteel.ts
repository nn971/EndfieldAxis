import { WeaponDef } from "../WeaponDef";

class SunderingSteelDef extends WeaponDef {
  constructor() {
    super({
      id: "sunderingsteel",
      name: "Sundering Steel",
      type: "sword",
      icon: "SUNDERINGSTEEL.png",
      atkStat: {
        level1: 42,
        level90: 411,
      },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "anthemofcinder",
        cat: "combative",
        name: "Anthem of Cinder",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => (40 + 10 * r + (r > 8 ? 10 : 0)) / 1000,
        },
      },
    });
  }
}

export default new SunderingSteelDef();
