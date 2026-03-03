import { WeaponDef } from "../WeaponDef";

class Finchaser30Def extends WeaponDef {
  constructor() {
    super({
      id: "finchaser30",
      name: "Finchaser 3.0",
      type: "sword",
      icon: "FINCHASER30.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "strengthboost", size: "M" },
      s2: { id: "cryodmgboost", size: "M" },
      s3: {
        id: "suppressionfinchasersintent",
        cat: "combative",
        name: "Fin Chaser's Intent",
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

export default new Finchaser30Def();
