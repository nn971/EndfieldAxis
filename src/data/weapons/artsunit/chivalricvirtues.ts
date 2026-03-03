import { WeaponDef } from "../WeaponDef";

class ChivalricVirtuesDef extends WeaponDef {
  constructor() {
    super({
      id: "chivalricvirtues",
      name: "Chivalric Virtues",
      type: "artsunit",
      icon: "CHIVALRICVIRTUES.png",
      atkStat: {
        level1: 49,
        level90: 485,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "medicantblightfervor",
        cat: "combative",
        name: "Medicant: Blight Fervor",
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

export default new ChivalricVirtuesDef();
