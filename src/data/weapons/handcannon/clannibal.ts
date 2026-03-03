import { WeaponDef } from "../WeaponDef";

class ClannibalDef extends WeaponDef {
  constructor() {
    super({
      id: "clannibal",
      name: "Clannibal",
      type: "handcannon",
      icon: "CLANNIBAL.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "attackboost", size: "L" },
      s2: { id: "physicaldmgboost", size: "L" },
      s3: {
        id: "inflictionviciouspurge",
        cat: "infliction",
        name: "Vicious Purge",
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

export default new ClannibalDef();
