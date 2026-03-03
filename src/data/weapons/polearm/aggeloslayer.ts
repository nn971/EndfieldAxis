import { WeaponDef } from "../WeaponDef";

class AggeloslayerDef extends WeaponDef {
  constructor() {
    super({
      id: "aggeloslayer",
      name: "Aggeloslayer",
      type: "polearm",
      icon: "AGGELOSLAYER.png",
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

export default new AggeloslayerDef();
