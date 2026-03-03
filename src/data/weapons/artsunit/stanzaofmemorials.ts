import { WeaponDef } from "../WeaponDef";

class StanzaOfMemorialsDef extends WeaponDef {
  constructor() {
    super({
      id: "stanzaofmemorials",
      name: "Stanza of Memorials",
      type: "artsunit",
      icon: "STANZAOFMEMORIALS.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "stanzaofmemorials_lustrouspyre",
        cat: "combative",
        name: "Lustrous Pyre",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.224, 0.246, 0.268, 0.291, 0.313, 0.336, 0.358, 0.381, 0.403];
            return values[r] ?? 0.224;
          },
        },
      },
    });
  }
}

export default new StanzaOfMemorialsDef();
