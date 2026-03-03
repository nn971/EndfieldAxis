import { WeaponDef } from "../WeaponDef";

class OBJVelocitousDef extends WeaponDef {
  constructor() {
    super({
      id: "objvelocitous",
      name: "OBJ Velocitous",
      type: "handcannon",
      icon: "OBJVELOCITOUS.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "attackboost", size: "M" },
      s3: {
        id: "objvelocitous_rapidstrike",
        cat: "combative",
        name: "Rapid Strike",
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

export default new OBJVelocitousDef();
