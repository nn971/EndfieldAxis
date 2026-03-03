import { WeaponDef } from "../WeaponDef";

class OpusTheLivingDef extends WeaponDef {
  constructor() {
    super({
      id: "opustheliving",
      name: "Opus: The Living",
      type: "handcannon",
      icon: "OPUSTHELIVING.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "physicaldmgboost", size: "M" },
      s3: {
        id: "opustheliving_roadhomeforalllife",
        cat: "infliction",
        name: "Road Home for All Life",
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

export default new OpusTheLivingDef();
