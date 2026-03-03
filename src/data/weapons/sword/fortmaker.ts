import { WeaponDef } from "../WeaponDef";

class FortmakerDef extends WeaponDef {
  constructor() {
    super({
      id: "fortmaker",
      name: "Fortmaker",
      type: "sword",
      icon: "FORTMAKER.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "intellectboost", size: "M" },
      s2: { id: "ultimategainefficiencyboost", size: "M" },
      s3: {
        id: "inspiringbacktothebrokencity",
        cat: "combative",
        name: "Back to the Broken City",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.14, 0.154, 0.168, 0.182, 0.196, 0.21, 0.224, 0.238, 0.252];
            return values[r] ?? 0.14;
          },
        },
      },
    });
  }
}

export default new FortmakerDef();
