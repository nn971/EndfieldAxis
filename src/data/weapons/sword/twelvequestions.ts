import { WeaponDef } from "../WeaponDef";

class TwelveQuestionsDef extends WeaponDef {
  constructor() {
    super({
      id: "twelvequestions",
      name: "Twelve Questions",
      type: "sword",
      icon: "TWELVEQUESTIONS.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "attackboost", size: "M" },
      s3: {
        id: "inflictionsincereinterrogation",
        cat: "infliction",
        name: "Sincere Interrogation",
        bonus: {
          bucket: "secondaryAttribute",
          byRank: r => {
            const values = [14, 15.4, 16.8, 18.2, 19.6, 21, 22.4, 23.8, 25.2];
            return values[r] ?? 14;
          },
        },
      },
    });
  }
}

export default new TwelveQuestionsDef();
