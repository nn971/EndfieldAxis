import { WeaponDef } from "../WeaponDef";

class AspirantDef extends WeaponDef {
  constructor() {
    super({
      id: "aspirant",
      name: "Aspirant",
      type: "sword",
      icon: "ASPIRANT.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "twilightimposingpeak",
        cat: "combative",
        name: "Imposing Peak",
        bonus: {
          bucket: "ultimateDmgIncRatio",
          byRank: r => {
            const values = [0.448, 0.493, 0.537, 0.582, 0.627, 0.672, 0.716, 0.761, 0.806];
            return values[r] ?? 0.448;
          },
        },
      },
    });
  }
}

export default new AspirantDef();
