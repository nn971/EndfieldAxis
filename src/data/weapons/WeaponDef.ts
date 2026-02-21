import { SimRegistry } from "../../simulator/listeners/registry";

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

export type WeaponSkillId = string;

export type WeaponDefInit = {
  id: WeaponId;
  name: string;
  type: WeaponType;
  icon: string;
  atkStat: {
    level1: number;
    level90: number;
  };
  skills: {
    1: WeaponSkillId;
    2: WeaponSkillId;
    3: { id: WeaponSkillId; name: string } | null;
  };
};

export class WeaponDef {
  public readonly id: WeaponId;
  public readonly name: string;
  public readonly type: WeaponType;
  public readonly icon: string;

  public readonly atkStat: {
    level1: number;
    level90: number;
  };
  public readonly skills: {
    1: WeaponSkillId;
    2: WeaponSkillId;
    3: { id: WeaponSkillId; name: string } | null;
  };

  protected constructor(init: WeaponDefInit) {
    this.id = init.id;
    this.name = init.name;
    this.type = init.type;
    this.icon = init.icon;
    this.atkStat = init.atkStat;
    this.skills = init.skills;
  }

  registerSimPlugins(_registry: SimRegistry): void {}
}
