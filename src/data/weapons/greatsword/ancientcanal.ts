import { WeaponDef } from "../WeaponDef";

class AncientCanalDef extends WeaponDef {
  constructor() {
    super({
      id: "ancientcanal",
      name: "Ancient Canal",
      type: "greatsword",
      icon: "ANCIENTCANAL.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "brutalitylandsofyore",
        cat: "combative",
        name: "Lands of Yore",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => {
            const values = [28, 30.8, 33.6, 36.4, 39.2, 42, 44.8, 47.6, 50.4];
            return values[r] ?? 28;
          },
        },
      },
    });
  }
}

export default new AncientCanalDef();
