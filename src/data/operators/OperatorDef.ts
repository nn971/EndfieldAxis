import type { SimRegistry } from "../../simulator/listeners/registry";

/**
 * OperatorDefClass
 * - Stores operator data in TypeScript (instead of JSON).
 * - Provides an optional hook to register simulator listeners ("abilities").
 *
 * This keeps the existing OperatorDef shape (structural typing) so the editor
 * and compiler can keep using OperatorDef without changes.
 */

export type DmgType = "physical" | "heat" | "electric" | "cryo" | "nature";

export type OperatorId = string;

export type OperatorAttributeType =
  | "strength"
  | "agility"
  | "intellect"
  | "will";

export type OperatorStatSnapshot = {
  attack: number;
  strength: number;
  agility: number;
  intellect: number;
  will: number;
};

export type SkillType =
  | "normalAttack"
  | "normalSkill"
  | "comboSkill"
  | "ultimate";
// | string;

export type SkillTimelineStep = (ctx: any) => any[];

export type SkillDef = {
  name: string;
  durationFrames: number;
  icon: string;
  timeline?: SkillTimelineStep[];
};

export type OperatorDefInit = {
  id: OperatorId;
  name: string;
  avatar: string;
  attributes: {
    main: OperatorAttributeType;
    sub: OperatorAttributeType;
  };
  stats: {
    level1: OperatorStatSnapshot;
    level90: OperatorStatSnapshot;
  };
  skills: {
    [key in SkillType]?: SkillDef;
  };
};

export class OperatorDef {
  public readonly id: OperatorId;
  public readonly name: string;
  public readonly avatar: string;
  public readonly attributes: {
    main: OperatorAttributeType;
    sub: OperatorAttributeType;
  };
  public readonly stats: {
    level1: OperatorStatSnapshot;
    level90: OperatorStatSnapshot;
  };
  public readonly skills: {
    [key in SkillType]?: SkillDef;
  };

  protected constructor(init: OperatorDefInit) {
    this.id = init.id;
    this.name = init.name;
    this.avatar = init.avatar;
    this.attributes = init.attributes;
    this.stats = init.stats;
    this.skills = init.skills;
  }

  /**
   * Optional: register simulator listeners for operator talents / potentials / etc.
   * Default is no-op.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  registerSimPlugins(_registry: SimRegistry): void {}
}
