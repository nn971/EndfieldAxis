import type {
  HitEvent,
  SimPluginRegisterFn,
} from "../../../simulator/simPlugins/registry";

const MAX_STACKS = 5;

function isSkillHit(ev: HitEvent): boolean {
  // We interpret "by a skill" as: the hit event carries skillType, and it's not normalAttack.
  const st = (ev as any).skillType as string | undefined;
  return Boolean(st && st !== "normalAttack");
}

export const register: SimPluginRegisterFn = registry => {
  registry.registerAfterHitForOperator({
    operatorId: "chenqianyu",
    id: "operator.chenqianyu.talent.atkStack",
    fn: ({ ops, ev, sourceId }) => {
      if (!isSkillHit(ev)) return;

      ops.addBuffStacks({
        targetId: sourceId,
        buffType: "chenqianyuAtk",
        delta: 1,
        maxStacks: MAX_STACKS,
        logOnChange: {
          cat: "buff&stat",
          format: (before, after) =>
            `BUFF chenqianyuAtk stacks ${before} -> ${after} (trigger=skillHit)`,
        },
      });
    },
  });
};
