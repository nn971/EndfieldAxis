import { WeaponDef } from "../WeaponDef";

class SeekerOfDarkLungDef extends WeaponDef {
  constructor() {
    super({
      id: "seekerofdarklung",
      name: "Seeker of Dark Lung",
      type: "greatsword",
      icon: "SEEKEROFDARKLUNG.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "detonateseekeroftheesoteric",
        cat: "combative",
        name: "Seeker of the Esoteric",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.168, 0.185, 0.202, 0.218, 0.235, 0.252, 0.269, 0.286, 0.302];
            return values[r] ?? 0.168;
          },
        },
      },
    });
  }
}

export default new SeekerOfDarkLungDef();
