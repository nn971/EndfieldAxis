import type { SkillType } from '../data/operators/OperatorDef';
import type {
  BaseWeaponSkillId,
  ThirdWeaponSkillCat,
  ThirdWeaponSkillId,
  WeaponType,
} from '../data/weapons/WeaponDef';
import type { GearsId, GearsType } from '../data/gears/GearsDef';

type TranslatorOptions = {
  defaultValue?: string;
};

export type ContentTranslator = (
  key: string,
  options?: TranslatorOptions,
) => string;

export const getOperatorNameKey = (operatorId: string): string =>
  `content.operator.${operatorId}.name`;

export const getOperatorSkillNameKey = (
  operatorId: string,
  skillType: SkillType,
): string => `content.operator.${operatorId}.skill.${skillType}`;

export const getWeaponNameKey = (weaponId: string): string =>
  `content.weapon.${weaponId}.name`;

export const getBaseWeaponSkillLabelKey = (
  baseWeaponSkillId: BaseWeaponSkillId,
): string => `content.weaponSkill.base.${baseWeaponSkillId}`;

export const getThirdWeaponSkillCatLabelKey = (
  cat: ThirdWeaponSkillCat,
): string => `content.weaponSkill.thirdCat.${cat}`;

export const getThirdWeaponSkillNameKey = (
  thirdWeaponSkillId: ThirdWeaponSkillId,
): string => `content.weaponSkill.third.${thirdWeaponSkillId}.name`;

export const getGearNameKey = (gearId: GearsId): string =>
  `content.gear.${gearId}.name`;

export const getGearSetNameKey = (setId: string): string =>
  `content.gearSet.${setId}.name`;

export const getWeaponTypeLabelKey = (weaponType: WeaponType): string =>
  `content.weaponType.${weaponType}`;

export const getGearTypeLabelKey = (gearType: GearsType): string =>
  `content.gearType.${gearType}`;

export const tOperatorName = (
  t: ContentTranslator,
  operatorId: string,
  defaultValue: string,
): string => t(getOperatorNameKey(operatorId), { defaultValue });

export const tOperatorSkillName = (
  t: ContentTranslator,
  operatorId: string,
  skillType: SkillType,
  defaultValue: string,
): string => t(getOperatorSkillNameKey(operatorId, skillType), { defaultValue });

export const tWeaponName = (
  t: ContentTranslator,
  weaponId: string,
  defaultValue: string,
): string => t(getWeaponNameKey(weaponId), { defaultValue });

export const tBaseWeaponSkillLabel = (
  t: ContentTranslator,
  baseWeaponSkillId: BaseWeaponSkillId,
  defaultValue: string,
): string => t(getBaseWeaponSkillLabelKey(baseWeaponSkillId), { defaultValue });

export const tThirdWeaponSkillCatLabel = (
  t: ContentTranslator,
  cat: ThirdWeaponSkillCat,
  defaultValue: string,
): string => t(getThirdWeaponSkillCatLabelKey(cat), { defaultValue });

export const tThirdWeaponSkillName = (
  t: ContentTranslator,
  thirdWeaponSkillId: ThirdWeaponSkillId,
  defaultValue: string,
): string => t(getThirdWeaponSkillNameKey(thirdWeaponSkillId), { defaultValue });

export const tGearName = (
  t: ContentTranslator,
  gearId: GearsId,
  defaultValue: string,
): string => t(getGearNameKey(gearId), { defaultValue });

export const tGearSetName = (
  t: ContentTranslator,
  setId: string,
  defaultValue: string,
): string => t(getGearSetNameKey(setId), { defaultValue });

export const tWeaponTypeLabel = (
  t: ContentTranslator,
  weaponType: WeaponType,
  defaultValue: string,
): string => t(getWeaponTypeLabelKey(weaponType), { defaultValue });

export const tGearTypeLabel = (
  t: ContentTranslator,
  gearType: GearsType,
  defaultValue: string,
): string => t(getGearTypeLabelKey(gearType), { defaultValue });
