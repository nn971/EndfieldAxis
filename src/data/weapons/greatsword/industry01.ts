import { WeaponDef } from "../WeaponDef";

class Industry01Def extends WeaponDef {
  constructor() {
    super({
      id: "industry01",
      name: "Industry 0.1",
      type: "greatsword",
      icon: "INDUSTRY01.png",
      atkStat: { level1: 34, level90: 341 },
      s1: { id: "attackboost", size: "S" },
      s2: { id: "attackboost", size: "S" },
      s3: {
        id: "suppressionemergencyboost",
        cat: "combative",
        name: "Suppression: Emergency Boost",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336];
            return values[r] ?? 0.12;
          },
        },
      },
    });
  }
}

export default new Industry01Def();
