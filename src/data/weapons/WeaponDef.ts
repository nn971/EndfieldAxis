import { SimRegistry } from "../../simulator/listeners/registry";
import { RestStatBonusBucket } from "../../types/operator";

export type WeaponId = string;

export type WeaponType =
  | "sword"
  | "artsunit"
  | "greatsword"
  | "polearm"
  | "handcannon";

export const WeaponTypeName = {
  sword: "Sword",
  artsunit: "Arts Unit",
  greatsword: "Greatsword",
  polearm: "Polearm",
  handcannon: "Handcannon",
} as Record<WeaponType, string>;

export type BaseWeaponSkillId =
  | "agilityboost"
  | "physicaldmgboost"
  | "attackboost";
export type Size = "L" | "M" | "S";
export type ThirdWeaponSkillCat = "combative" | "infliction";
export type ThirdWeaponSkillId = string; // unique id for each weapon's 3rd skill

export type WeaponSkillId = BaseWeaponSkillId | ThirdWeaponSkillCat;

export type WeaponDefInit = {
  id: WeaponId;
  name: string;
  type: WeaponType;
  icon: string;
  atkStat: {
    level1: number;
    level90: number;
  };

  s1: { id: BaseWeaponSkillId; size: "S" | "M" | "L" };
  s2: { id: BaseWeaponSkillId; size: "S" | "M" | "L" };
  s3: {
    id: ThirdWeaponSkillId;
    cat: ThirdWeaponSkillCat;
    name: string;
    bonus: {
      bucket: RestStatBonusBucket;
      byRank: (rank: number) => number;
    };
  };
};

export class WeaponDef {
  /** Each weapon has a unique 3rd skill,
   * its boost value should be calculated separately,
   * and its behavior should be handled by sim plugins. */
  public readonly id: WeaponId;
  public readonly name: string;
  public readonly type: WeaponType;
  public readonly icon: string;

  public readonly atkStat: {
    level1: number;
    level90: number;
  };
  public readonly s1: { id: BaseWeaponSkillId; size: "S" | "M" | "L" };
  public readonly s2: { id: BaseWeaponSkillId; size: "S" | "M" | "L" };
  public readonly s3: {
    id: ThirdWeaponSkillId;
    cat: ThirdWeaponSkillCat;
    name: string;
    bonus: {
      bucket: RestStatBonusBucket;
      byRank: (rank: number) => number;
    };
  };

  protected constructor(init: WeaponDefInit) {
    this.id = init.id;
    this.name = init.name;
    this.type = init.type;
    this.icon = init.icon;
    this.atkStat = init.atkStat;
    this.s1 = init.s1;
    this.s2 = init.s2;
    this.s3 = init.s3;
  }

  registerSimPlugins(_registry: SimRegistry): void {}
}

export const BASE_WEAPON_SKILL_LABEL: Record<BaseWeaponSkillId, string> = {
  agilityboost: "Agility Boost",
  physicaldmgboost: "Physical DMG Boost",
  attackboost: "ATK Boost",
};

export const THIRD_WEAPON_SKILL_CAT_LABEL: Record<ThirdWeaponSkillCat, string> =
  {
    combative: "Combative",
    infliction: "Infliction",
  };
