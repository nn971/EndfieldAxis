import { WeaponDef } from "../WeaponDef";

class WedgeDef extends WeaponDef {
  constructor() {
    super({
      id: "wedge",
      name: "Wedge",
      type: "handcannon",
      icon: "WEDGE.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      s1: { id: "attackboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "inflictionwedgeofcivilization",
        cat: "infliction",
        name: "Wedge of Civilization",
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

export default new WedgeDef();
