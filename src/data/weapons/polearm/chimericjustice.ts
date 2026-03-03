import { WeaponDef } from "../WeaponDef";

class ChimericJusticeDef extends WeaponDef {
  constructor() {
    super({
      id: "chimericjustice",
      name: "Chimeric Justice",
      type: "polearm",
      icon: "CHIMERICJUSTICE.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "brutalitycementedfury",
        cat: "combative",
        name: "Cemented Fury",
        bonus: {
          bucket: "agility",
          byRank: r => {
            const values = [8.4, 9.24, 10.08, 10.92, 11.76, 12.6, 13.44, 14.28, 15.12];
            return values[r] ?? 8.4;
          },
        },
      },
    });
  }
}

export default new ChimericJusticeDef();
